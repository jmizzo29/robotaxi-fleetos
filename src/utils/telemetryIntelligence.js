import { extractVehicleTelemetry } from './telemetryUtils';

const LOW_BATTERY = 20;
const LIMITED_BATTERY = 40;
const READY_BATTERY = 70;
const STALE_SYNC_MINUTES = 30;
const VERY_STALE_SYNC_MINUTES = 120;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeText(value) {
  return String(value || '').trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function minutesSince(value, now = Date.now()) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((now - time) / 60000));
}

function isOfflineState(state) {
  const raw = lower(state);
  return raw.includes('offline') || raw.includes('asleep') || raw.includes('sleep');
}

function isOnlineState(state) {
  const raw = lower(state);
  return raw.includes('online') || raw.includes('parked') || raw.includes('driving') || raw.includes('ready');
}

function isChargingState(chargingState) {
  const raw = lower(chargingState);
  return raw.includes('charging') && !raw.includes('complete');
}

function isCompleteChargeState(chargingState) {
  const raw = lower(chargingState);
  return raw.includes('complete') || raw.includes('full');
}

function isServiceMode(vehicle) {
  if (vehicle?.serviceMode === true || vehicle?.vehicle_state?.service_mode === true) return true;
  const raw = `${normalizeText(vehicle?.status)} ${normalizeText(vehicle?.state)}`.toLowerCase();
  return raw.includes('service') || raw.includes('maintenance');
}

function isLockedFalse(vehicle) {
  if (vehicle?.locked === false) return true;
  if (vehicle?.vehicle_state?.locked === false) return true;
  return false;
}

function vehicleName(vehicle, index = 0) {
  return vehicle?.display_name || vehicle?.name || vehicle?.vin || vehicle?.id || `Vehicle ${index + 1}`;
}

function scoreLabel(score, highLabel, goodLabel, limitedLabel, lowLabel) {
  if (score >= 90) return highLabel;
  if (score >= 75) return goodLabel;
  if (score >= 50) return limitedLabel;
  return lowLabel;
}

function buildSyncConfidence(telemetry, now) {
  const syncAgeMinutes = minutesSince(telemetry.syncedAt, now);
  const missing = [];

  if (!hasValue(telemetry.battery)) missing.push('battery');
  if (!hasValue(telemetry.chargingState)) missing.push('charging');
  if (!hasValue(telemetry.state)) missing.push('state');
  if (!hasValue(telemetry.latitude) || !hasValue(telemetry.longitude)) missing.push('location');
  if (!hasValue(telemetry.syncedAt)) missing.push('sync');

  let score = 100 - missing.length * 8;
  if (syncAgeMinutes === null) score -= 25;
  else if (syncAgeMinutes > VERY_STALE_SYNC_MINUTES) score -= 35;
  else if (syncAgeMinutes > STALE_SYNC_MINUTES) score -= 15;

  const confidenceScore = clampScore(score);
  return {
    score: confidenceScore,
    label: confidenceScore >= 85 ? 'High' : confidenceScore >= 65 ? 'Medium' : 'Low',
    stale: syncAgeMinutes !== null && syncAgeMinutes > STALE_SYNC_MINUTES,
    syncAgeMinutes,
    missingFields: missing,
  };
}

function readinessAction({ offline, serviceMode, battery, charging, stale }) {
  if (serviceMode) return 'Keep out of revenue service until service mode clears.';
  if (offline) return 'Wake and sync this vehicle before dispatch.';
  if (Number.isFinite(battery) && battery < LOW_BATTERY) return 'Route to charging before accepting work.';
  if (charging) return 'Hold until charging target is reached.';
  if (stale) return 'Refresh telemetry before making a dispatch decision.';
  return 'Keep this vehicle in the earning pool.';
}

function healthAction({ serviceMode, offline, stale, unlockedIdle, lowBattery }) {
  if (serviceMode) return 'Review service mode before assigning work.';
  if (offline) return 'Wake and sync to confirm current asset state.';
  if (lowBattery) return 'Charge soon to protect availability.';
  if (unlockedIdle) return 'Lock the vehicle to protect the asset.';
  if (stale) return 'Refresh telemetry to confirm current health.';
  return 'No action needed.';
}

function deriveRevenueReadiness(vehicle, telemetry, confidence) {
  const battery = telemetry.battery;
  const offline = isOfflineState(telemetry.state);
  const serviceMode = isServiceMode(vehicle);
  const charging = isChargingState(telemetry.chargingState);
  const chargeComplete = isCompleteChargeState(telemetry.chargingState);
  const blockers = [];
  let score = 100;

  if (offline) {
    score -= 45;
    blockers.push('Vehicle is offline or asleep.');
  }
  if (serviceMode) {
    score -= 55;
    blockers.push('Service mode is active.');
  }
  if (charging && !chargeComplete) {
    score -= 25;
    blockers.push('Vehicle is charging.');
  }
  if (!Number.isFinite(battery)) {
    score -= 15;
    blockers.push('Battery level is unavailable.');
  } else if (battery < LOW_BATTERY) {
    score -= 60;
    blockers.push('Battery is below the revenue floor.');
  } else if (battery < LIMITED_BATTERY) {
    score -= 22;
    blockers.push('Battery is limited for revenue work.');
  }
  if (confidence.stale) {
    score -= 15;
    blockers.push('Telemetry is stale.');
  }

  const readinessScore = clampScore(score);
  return {
    score: readinessScore,
    label: scoreLabel(readinessScore, 'Ready For Revenue', 'Available', 'Limited', 'Hold Back'),
    state: readinessScore >= 90 ? 'ready' : readinessScore >= 75 ? 'available' : readinessScore >= 50 ? 'limited' : 'hold',
    blockers,
    recommendedAction: readinessAction({
      offline,
      serviceMode,
      battery,
      charging,
      stale: confidence.stale,
    }),
  };
}

function deriveAssetHealth(vehicle, telemetry, confidence) {
  const battery = telemetry.battery;
  const offline = isOfflineState(telemetry.state);
  const serviceMode = isServiceMode(vehicle);
  const unlockedIdle = isLockedFalse(vehicle) && Number(telemetry.speed || 0) <= 1;
  const issues = [];
  let score = 100;

  if (serviceMode) {
    score -= 65;
    issues.push('Service mode is active.');
  }
  if (offline) {
    score -= 30;
    issues.push('Vehicle is offline or asleep.');
  }
  if (!Number.isFinite(battery)) {
    score -= 10;
    issues.push('Battery condition is unknown.');
  } else if (battery < LOW_BATTERY) {
    score -= 30;
    issues.push('Battery is critically low.');
  } else if (battery < LIMITED_BATTERY) {
    score -= 12;
    issues.push('Battery is below preferred operating range.');
  }
  if (confidence.stale) {
    score -= 15;
    issues.push('Telemetry needs refresh.');
  }
  if (unlockedIdle) {
    score -= 12;
    issues.push('Vehicle is unlocked while idle.');
  }

  const healthScore = clampScore(score);
  return {
    score: healthScore,
    label: scoreLabel(healthScore, 'Excellent', 'Good', 'Watch', 'Needs Attention'),
    state: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : healthScore >= 50 ? 'watch' : 'attention',
    issues,
    recommendedAction: healthAction({
      serviceMode,
      offline,
      stale: confidence.stale,
      unlockedIdle,
      lowBattery: Number.isFinite(battery) && battery < LOW_BATTERY,
    }),
  };
}

function deriveAvailability(vehicle, telemetry, readiness) {
  const battery = telemetry.battery;
  const offline = isOfflineState(telemetry.state);
  const serviceMode = isServiceMode(vehicle);
  const charging = isChargingState(telemetry.chargingState);

  if (serviceMode) {
    return { available: false, state: 'service', label: 'Needs Attention', reason: 'Service mode active' };
  }
  if (offline) {
    return { available: false, state: 'offline', label: 'Offline', reason: 'Wake and sync needed' };
  }
  if (Number.isFinite(battery) && battery < LOW_BATTERY) {
    return { available: false, state: 'low_battery', label: 'Needs Charge', reason: 'Battery below revenue floor' };
  }
  if (charging) {
    const nearlyReady = Number.isFinite(battery) && battery >= READY_BATTERY;
    return {
      available: nearlyReady,
      state: nearlyReady ? 'charging_ready' : 'charging',
      label: nearlyReady ? 'Available Soon' : 'Charging',
      reason: nearlyReady ? 'Charging but near ready target' : 'Charging session active',
    };
  }
  if (readiness.score >= 75) {
    return { available: true, state: 'available', label: 'Available', reason: 'Ready for revenue work' };
  }
  return { available: false, state: 'limited', label: 'Limited', reason: 'Readiness score below dispatch target' };
}

function deriveActivity(vehicle, telemetry) {
  const speed = Number(telemetry.speed || 0);
  if (speed > 1) return { state: 'driving', label: 'Trip In Progress' };
  if (isChargingState(telemetry.chargingState)) return { state: 'charging', label: 'Charging' };
  if (isOfflineState(telemetry.state)) return { state: 'offline', label: 'Offline' };
  if (isOnlineState(telemetry.state)) return { state: 'available', label: 'Vehicle Available' };
  if (isServiceMode(vehicle)) return { state: 'service', label: 'Service Review' };
  return { state: 'unknown', label: 'Status Unknown' };
}

function topVehicleAction(readiness, health, availability) {
  if (availability.state === 'service') return availability.reason;
  if (health.state === 'attention') return health.recommendedAction;
  if (readiness.state === 'hold') return readiness.recommendedAction;
  if (health.issues.length > 0) return health.recommendedAction;
  if (readiness.blockers.length > 0) return readiness.recommendedAction;
  return readiness.recommendedAction;
}

export function getVehicleTelemetryIntelligence(vehicle = {}, options = {}) {
  const now = options.now ? new Date(options.now).getTime() : Date.now();
  const telemetry = extractVehicleTelemetry(vehicle);
  const confidence = buildSyncConfidence(telemetry, now);
  const revenueReadiness = deriveRevenueReadiness(vehicle, telemetry, confidence);
  const assetHealth = deriveAssetHealth(vehicle, telemetry, confidence);
  const availability = deriveAvailability(vehicle, telemetry, revenueReadiness);
  const activity = deriveActivity(vehicle, telemetry);
  const severity = assetHealth.state === 'attention' || revenueReadiness.state === 'hold'
    ? 'critical'
    : assetHealth.state === 'watch' || revenueReadiness.state === 'limited'
      ? 'warning'
      : 'normal';
  const reasons = [
    ...revenueReadiness.blockers,
    ...assetHealth.issues.filter((issue) => !revenueReadiness.blockers.includes(issue)),
  ];

  return {
    vehicle,
    vehicleId: vehicle.id || vehicle.vin || null,
    vin: vehicle.vin || null,
    name: vehicleName(vehicle, options.index || 0),
    telemetry,
    revenueReadiness,
    assetHealth,
    availability,
    activity,
    attention: {
      needsAttention: severity !== 'normal',
      severity,
      reasons,
      primaryReason: reasons[0] || null,
      recommendedAction: topVehicleAction(revenueReadiness, assetHealth, availability),
    },
    confidence,
  };
}

function averageScore(items, getter) {
  if (!items.length) return null;
  const scores = items.map(getter).filter(Number.isFinite);
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getFleetStatus({ total, attentionCount, availableCount, chargingCount, syncStatus, averageReadiness }) {
  if (syncStatus?.state === 'error') {
    return {
      state: 'attention',
      headline: 'Fleet Needs Attention',
      detail: syncStatus.message || 'Tesla telemetry sync needs review.',
    };
  }
  if (!total) {
    return {
      state: 'recommended',
      headline: 'Action Recommended',
      detail: 'Connect Tesla to activate fleet intelligence.',
    };
  }
  if (attentionCount > 0) {
    return {
      state: 'attention',
      headline: 'Fleet Needs Attention',
      detail: `${attentionCount} asset${attentionCount === 1 ? '' : 's'} need review.`,
    };
  }
  if (availableCount < total || chargingCount > 0) {
    return {
      state: 'recommended',
      headline: 'Action Recommended',
      detail: `${availableCount} of ${total} vehicles are available now.`,
    };
  }
  if (Number.isFinite(averageReadiness) && averageReadiness >= 92 && total > 1) {
    return {
      state: 'growth',
      headline: 'Growth Opportunity Detected',
      detail: 'Fleet readiness is strong enough to review expansion opportunities.',
    };
  }
  return {
    state: 'normal',
    headline: 'Fleet Operating Normally',
    detail: 'Vehicles are available and telemetry is healthy.',
  };
}

function chooseTopAction(vehicles, syncStatus) {
  if (syncStatus?.state === 'error') {
    return {
      label: 'Retry Tesla sync',
      reason: syncStatus.message || 'Telemetry sync failed.',
      priority: 'high',
      vehicleId: null,
    };
  }

  const candidate = vehicles
    .filter((entry) => entry.attention.needsAttention)
    .sort((a, b) => {
      const severityDelta = a.attention.severity === 'critical' && b.attention.severity !== 'critical' ? -1 : 0;
      if (severityDelta !== 0) return severityDelta;
      return a.revenueReadiness.score - b.revenueReadiness.score;
    })[0];

  if (candidate) {
    return {
      label: candidate.attention.recommendedAction,
      reason: candidate.attention.primaryReason,
      priority: candidate.attention.severity === 'critical' ? 'high' : 'normal',
      vehicleId: candidate.vehicleId,
      vehicleName: candidate.name,
    };
  }

  return {
    label: 'Keep fleet in revenue service',
    reason: 'No immediate telemetry blockers detected.',
    priority: 'normal',
    vehicleId: null,
  };
}

export function getFleetTelemetryIntelligence(fleet = [], realFleet = [], syncStatus = {}, options = {}) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const vehicles = source.map((vehicle, index) => getVehicleTelemetryIntelligence(vehicle, {
    ...options,
    index,
  }));

  const total = vehicles.length;
  const availableCount = vehicles.filter((entry) => entry.availability.available).length;
  const chargingCount = vehicles.filter((entry) => entry.availability.state === 'charging').length;
  const offlineCount = vehicles.filter((entry) => entry.availability.state === 'offline').length;
  const serviceCount = vehicles.filter((entry) => entry.availability.state === 'service').length;
  const attentionCount = vehicles.filter((entry) => entry.attention.needsAttention).length;
  const readyForRevenueCount = vehicles.filter((entry) => entry.revenueReadiness.score >= 90).length;
  const averageReadiness = averageScore(vehicles, (entry) => entry.revenueReadiness.score);
  const averageHealth = averageScore(vehicles, (entry) => entry.assetHealth.score);
  const availabilityPercent = total ? Math.round((availableCount / total) * 100) : 0;

  return {
    source: realFleet.length > 0 ? 'real' : 'fleet',
    syncState: syncStatus?.state || 'idle',
    totals: {
      total,
      available: availableCount,
      unavailable: Math.max(0, total - availableCount),
      charging: chargingCount,
      offline: offlineCount,
      service: serviceCount,
      needsAttention: attentionCount,
      readyForRevenue: readyForRevenueCount,
      availabilityPercent,
      averageReadiness,
      averageHealth,
    },
    status: getFleetStatus({
      total,
      attentionCount,
      availableCount,
      chargingCount,
      syncStatus,
      averageReadiness,
    }),
    topAction: chooseTopAction(vehicles, syncStatus),
    vehicles,
  };
}

function eventTime(current, previous) {
  return current?.syncedAt || current?.lastSyncedAt || previous?.syncedAt || previous?.lastSyncedAt || new Date().toISOString();
}

export function getVehicleActivityEvents(currentVehicle = {}, previousVehicle = null) {
  const current = extractVehicleTelemetry(currentVehicle);
  const previous = previousVehicle ? extractVehicleTelemetry(previousVehicle) : null;
  const name = vehicleName(currentVehicle);
  const timestamp = eventTime(currentVehicle, previousVehicle);

  if (!previous) {
    return [{
      type: 'snapshot',
      title: deriveActivity(currentVehicle, current).label,
      detail: `${name} telemetry snapshot recorded.`,
      timestamp,
      vehicleId: currentVehicle.id || currentVehicle.vin || null,
    }];
  }

  const events = [];
  const wasMoving = Number(previous.speed || 0) > 1;
  const isMoving = Number(current.speed || 0) > 1;
  const wasCharging = isChargingState(previous.chargingState);
  const charging = isChargingState(current.chargingState);
  const wasOffline = isOfflineState(previous.state);
  const offline = isOfflineState(current.state);

  if (!wasMoving && isMoving) {
    events.push({ type: 'trip_started', title: 'Trip Started', detail: `${name} started moving.`, timestamp });
  }
  if (wasMoving && !isMoving) {
    events.push({ type: 'trip_completed', title: 'Trip Completed', detail: `${name} stopped moving.`, timestamp });
  }
  if (!wasCharging && charging) {
    events.push({ type: 'charging_started', title: 'Charging Started', detail: `${name} started charging.`, timestamp });
  }
  if (wasCharging && !charging) {
    events.push({ type: 'charging_completed', title: 'Charging Completed', detail: `${name} left charging.`, timestamp });
  }
  if (!wasOffline && offline) {
    events.push({ type: 'vehicle_offline', title: 'Vehicle Offline', detail: `${name} went offline or asleep.`, timestamp });
  }
  if (wasOffline && !offline) {
    events.push({ type: 'vehicle_available', title: 'Vehicle Available', detail: `${name} came back online.`, timestamp });
  }
  if (previous.battery !== null && current.battery !== null && previous.battery - current.battery >= 15) {
    events.push({ type: 'battery_used', title: 'Battery Used', detail: `${name} used ${previous.battery - current.battery}% battery.`, timestamp });
  }

  return events;
}
