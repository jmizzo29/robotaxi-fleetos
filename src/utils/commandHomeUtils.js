import {
  getFleetPreviewMeta,
  getFleetRecommendation,
  lastSyncedLabel,
  vehicleBatteryPercent,
  vehicleDisplayName,
  vehicleStateLabel,
} from './vehicleDisplayUtils';

function isVehicleOnline(vehicle) {
  const state = vehicleStateLabel(vehicle);
  return state !== 'Offline' && state !== 'Asleep';
}

function fleetVehicleLabel(vehicle, index) {
  const name = vehicleDisplayName(vehicle);
  if (name && name !== 'Your Tesla') return name;
  return vehicle?.id || `Vehicle ${index + 1}`;
}

function categorizeCommand(command = '') {
  const text = String(command).toLowerCase();
  if (text.includes('pric') || text.includes('rate') || text.includes('turo')) return 'pricing';
  if (text.includes('clean') || text.includes('maintenance') || text.includes('service') || text.includes('tire')) {
    return 'maintenance';
  }
  if (text.includes('charg')) return 'charging';
  return 'operations';
}

/** Operational status board — not analytics KPIs. */
export function getCommandStatusBoard(fleet, realFleet, syncState, commandQueue = []) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const active = source.filter(isVehicleOnline).length;
  const total = source.length;

  const utilValues = source
    .map((vehicle) => Number(vehicle.utilization))
    .filter(Number.isFinite);
  const utilization = utilValues.length
    ? Math.round(utilValues.reduce((sum, value) => sum + value, 0) / utilValues.length)
    : null;

  const utilDelta = source.some((vehicle) => Number.isFinite(Number(vehicle.utilizationDelta)))
    ? Math.round(
      source
        .map((vehicle) => Number(vehicle.utilizationDelta))
        .filter(Number.isFinite)
        .reduce((sum, value, _, arr) => sum + value / arr.length, 0),
    )
    : null;

  const primaryReal = realFleet[0];
  const previewMeta = primaryReal ? getFleetPreviewMeta(primaryReal) : null;
  const realSub = primaryReal
    ? [previewMeta?.subtitle?.replace(/^\d{4}\s/, ''), previewMeta?.meta].filter(Boolean).join(' · ')
    : syncState === 'loading'
      ? 'Syncing…'
      : 'Connect Tesla';

  const breakdown = getOpenActionsBreakdown(commandQueue, fleet, realFleet);
  const openTotal = breakdown.pricing + breakdown.maintenance + breakdown.other;

  return {
    active: {
      value: total ? `${active}/${total}` : '—',
      sub: !total ? 'No fleet yet' : active === total ? 'All online' : `${total - active} offline`,
      tone: !total || active < total ? 'caution' : 'ready',
    },
    utilization: {
      value: utilization !== null ? `${utilization}%` : '—',
      sub: utilDelta !== null && utilDelta !== 0
        ? `${utilDelta > 0 ? '↑' : '↓'}${Math.abs(utilDelta)}% from yesterday`
        : utilization !== null
          ? 'Fleet average'
          : 'Awaiting telemetry',
      tone: utilization !== null && utilization < 55 ? 'caution' : 'neutral',
    },
    realTesla: {
      value: String(realFleet.length),
      sub: realSub || 'No Tesla linked',
      tone: realFleet.length > 0 ? 'connected' : 'idle',
    },
    openActions: {
      value: String(openTotal),
      sub: breakdown.label,
      tone: openTotal > 0 ? 'attention' : 'ready',
    },
  };
}

export function getOpenActionsBreakdown(commandQueue = [], fleet = [], realFleet = []) {
  const counts = { pricing: 0, maintenance: 0, charging: 0, other: 0 };

  for (const item of commandQueue) {
    const bucket = categorizeCommand(item.command);
    if (bucket === 'pricing') counts.pricing += 1;
    else if (bucket === 'maintenance') counts.maintenance += 1;
    else if (bucket === 'charging') counts.charging += 1;
    else counts.other += 1;
  }

  const source = realFleet.length > 0 ? realFleet : fleet;
  if (counts.pricing === 0) {
    const pricingCandidate = source.find((vehicle) => Number(vehicle.utilization) >= 72);
    if (pricingCandidate) counts.pricing += 1;
  }
  if (counts.maintenance === 0) {
    const serviceCandidate = source.find((vehicle) => {
      const score = Number(vehicle.maintenanceScore);
      return Number.isFinite(score) && score < 78;
    });
    if (serviceCandidate) counts.maintenance += 1;
  }
  if (counts.charging === 0) {
    const chargeCandidate = source.find((vehicle) => {
      const battery = vehicleBatteryPercent(vehicle);
      return battery !== null && battery < 35;
    });
    if (chargeCandidate) counts.charging += 1;
  }

  const parts = [];
  if (counts.pricing) parts.push(`${counts.pricing} pricing`);
  if (counts.maintenance) parts.push(`${counts.maintenance} cleaning`);
  if (counts.charging) parts.push(`${counts.charging} charging`);
  if (counts.other) parts.push(`${counts.other} ops`);

  return {
    ...counts,
    label: parts.length ? parts.join(' · ') : 'Nothing queued',
  };
}

function buildPlanSummary(recommendation, breakdown, fleet, realFleet) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const online = source.filter(isVehicleOnline).length;

  if (breakdown.pricing > 0 || online >= 2) {
    return 'Increase Orlando airport coverage after 4 PM';
  }
  if (breakdown.charging > 0 || recommendation?.route === 'charging') {
    return 'Stage charging before evening demand window';
  }
  if (breakdown.maintenance > 0) {
    return 'Clear service vehicles before peak operating hours';
  }
  if (source.length > 0) {
    return 'Increase Orlando airport coverage after 4 PM';
  }
  return 'Connect fleet telemetry to unlock AI operations brief';
}

function buildPlanAction(fleet, realFleet, breakdown) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const target = source.find((vehicle) => Number(vehicle.utilization) >= 65)
    || source.find(isVehicleOnline)
    || source[0];
  if (!target) return 'Deploy first vehicle to MCO demand zone';

  const label = activityVehicleName(target, source.indexOf(target));
  if (breakdown.charging > 0) {
    return `Schedule ${label} for off-peak charging before 4 PM`;
  }
  return `Move ${label} to MCO demand zone`;
}

function buildDemandIncrease(breakdown, fleet, realFleet) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  let pct = 18;
  if (breakdown.pricing > 0) pct += 9;
  if (source.some((vehicle) => Number(vehicle.utilization) >= 72)) pct += 12;
  if (source.length >= 5) pct += 6;
  return `+${Math.min(42, pct)}%`;
}

function buildPlanChecklist(fleet, realFleet, recommendation, breakdown) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const items = [];

  if (breakdown.pricing > 0) {
    const target = source.find((vehicle) => Number(vehicle.utilization) >= 65) || source[0];
    if (target) {
      items.push(`Raise ${fleetVehicleLabel(target, source.indexOf(target))} weekend pricing`);
    }
  }

  const chargeTarget = source.find((vehicle) => {
    const battery = vehicleBatteryPercent(vehicle);
    return battery !== null && battery < 80 && vehicleStateLabel(vehicle) !== 'Charging';
  });
  if (chargeTarget) {
    items.push(`Charge ${fleetVehicleLabel(chargeTarget, source.indexOf(chargeTarget))} after 11 PM`);
  }

  const cleanTarget = source.find((vehicle) => {
    const score = Number(vehicle.maintenanceScore);
    return Number.isFinite(score) && score < 80;
  }) || source.find((vehicle) => vehicleStateLabel(vehicle) === 'Parked');
  if (cleanTarget) {
    items.push(`Clean ${fleetVehicleLabel(cleanTarget, source.indexOf(cleanTarget))} before morning`);
  }

  if (recommendation?.title && recommendation.tone !== 'ready' && items.length < 3) {
    items.unshift(recommendation.title);
  }

  return items.slice(0, 3);
}

function buildExpectedRevenueImpact(breakdown, fleet, realFleet) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  let bump = 72;
  if (breakdown.pricing > 0) bump += 24;
  if (breakdown.charging > 0) bump += 18;
  if (source.some((vehicle) => Number(vehicle.utilization) >= 72)) bump += 32;
  return `+$${bump} today`;
}

function buildConfidenceLabel(realSyncStatus, realFleet) {
  if (realSyncStatus?.state === 'success' && realFleet.length > 0) return 'High';
  if (realFleet.length > 0) return 'Medium';
  return 'Low';
}

function activityVehicleName(vehicle, index) {
  const id = String(vehicle?.id || vehicle?.name || '');
  const match = id.match(/\d+/);
  if (match) return `CAB-${String(match[0]).padStart(2, '0')}`;
  return `CAB-${String(index + 1).padStart(2, '0')}`;
}

function tripDescription(vehicle, name) {
  const status = String(vehicle?.status || '').toUpperCase();
  if (status.includes('AIRPORT') || status.includes('MCO')) {
    return `${name} completed airport trip`;
  }
  if (status.includes('PICK') || status.includes('ROUTE') || status.includes('SERVICE')) {
    return `${name} completed revenue trip`;
  }
  return `${name} completed trip`;
}

function activityTimestamp(vehicle, index) {
  const label = lastSyncedLabel(vehicle?.syncedAt || vehicle?.lastSyncedAt, 'Updated');
  if (label) return label.replace(/^Updated /, '');
  const minutes = (index + 1) * 2;
  if (minutes <= 2) return '2 min ago';
  return `${minutes} min ago`;
}

function tripImpactAmount(vehicle, index) {
  const revenue = Number(vehicle.revenue) || 0;
  if (vehicle.isReal) {
    return Math.max(12, Math.round(revenue / Math.max(1, Math.round((Number(vehicle.utilization) || 40) / 18))));
  }
  return 24 + ((index + 1) * 7) % 18;
}

function chargingReadyLabel(vehicle) {
  const battery = vehicleBatteryPercent(vehicle);
  if (battery === null) return 'Ready in 34 min';
  const minutes = Math.max(12, Math.round((100 - battery) * 0.55));
  return `Ready in ${minutes} min`;
}

/** Live fleet activity feed for Command screen. */
export function getFleetActivityFeed(fleet, realFleet, limit = 5) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const events = [];

  source.forEach((vehicle, index) => {
    const name = activityVehicleName(vehicle, index);
    const status = vehicleStateLabel(vehicle);
    const revenue = Math.round(Number(vehicle.revenue) || 0);
    const utilization = Number(vehicle.utilization);
    const timestamp = activityTimestamp(vehicle, index);

    if (revenue > 0) {
      const tripAmount = tripImpactAmount(vehicle, index);
      events.push({
        id: `${vehicle.id || index}-trip`,
        vehicleName: name,
        description: tripDescription(vehicle, name),
        impact: `+$${tripAmount.toFixed(0)} revenue`,
        impactTone: 'positive',
        eventType: 'trip',
        timestamp,
        vehicle,
      });
    }

    if (status === 'Charging') {
      events.push({
        id: `${vehicle.id || index}-charge`,
        vehicleName: name,
        description: `${name} entered charging session`,
        impact: chargingReadyLabel(vehicle),
        impactTone: 'neutral',
        eventType: 'charging',
        timestamp,
        vehicle,
      });
    }

    if (status === 'Offline' || status === 'Asleep') {
      events.push({
        id: `${vehicle.id || index}-offline`,
        vehicleName: name,
        description: `${name} offline unexpectedly`,
        impact: 'Needs review',
        impactTone: 'alert',
        eventType: 'offline',
        timestamp,
        vehicle,
      });
    }

    const tripsToday = Number(vehicle.tripsToday) || Number(vehicle.trips) || 0;
    if (tripsToday >= 10) {
      events.push({
        id: `${vehicle.id || index}-milestone`,
        vehicleName: name,
        description: `${name} completed ${tripsToday}th trip today`,
        impact: 'High utilization',
        impactTone: 'positive',
        eventType: 'milestone',
        timestamp,
        vehicle,
      });
    }

    if (Number.isFinite(utilization) && utilization >= 68) {
      const surgePct = Math.min(38, Math.round((utilization - 55) / 2));
      const zone = String(vehicle.city || 'Downtown Tampa').split(',')[0].trim();
      events.push({
        id: `${vehicle.id || index}-surge`,
        vehicleName: name,
        description: 'Demand surge detected',
        impact: `${zone} +${surgePct}%`,
        impactTone: 'surge',
        eventType: 'surge',
        timestamp,
        vehicle,
      });
    }
  });

  if (!events.length) {
    return [
      { id: 'demo-7-trip', vehicleName: 'CAB-07', description: 'CAB-07 completed airport trip', impact: '+$48 revenue', impactTone: 'positive', eventType: 'trip', timestamp: '2 min ago' },
      { id: 'demo-surge', vehicleName: 'Market', description: 'Demand surge detected', impact: 'Downtown Tampa +22%', impactTone: 'surge', eventType: 'surge', timestamp: '5 min ago' },
      { id: 'demo-2-charge', vehicleName: 'CAB-02', description: 'CAB-02 entered charging session', impact: 'Ready in 38 min', impactTone: 'neutral', eventType: 'charging', timestamp: '8 min ago' },
      { id: 'demo-5-milestone', vehicleName: 'CAB-05', description: 'CAB-05 completed 14th trip today', impact: 'High utilization', impactTone: 'positive', eventType: 'milestone', timestamp: '12 min ago' },
      { id: 'demo-9-offline', vehicleName: 'CAB-09', description: 'CAB-09 offline unexpectedly', impact: 'Needs review', impactTone: 'alert', eventType: 'offline', timestamp: '18 min ago' },
    ].slice(0, limit);
  }

  return events.slice(0, limit);
}

/** AI Operations Brief — fleet manager guidance, not a chatbot. */
export function getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue = []) {
  const snapshotSource = realFleet.length > 0 ? realFleet : fleet;
  const recommendation = getFleetRecommendation(snapshotSource, realSyncStatus);
  const breakdown = getOpenActionsBreakdown(commandQueue, fleet, realFleet);
  const pendingCount = Math.max(
    commandQueue.length,
    breakdown.pricing + breakdown.maintenance + breakdown.charging,
  );

  return {
    summary: buildPlanSummary(recommendation, breakdown, fleet, realFleet),
    action: buildPlanAction(fleet, realFleet, breakdown),
    demandIncrease: buildDemandIncrease(breakdown, fleet, realFleet),
    checklist: buildPlanChecklist(fleet, realFleet, recommendation, breakdown),
    pendingCount: pendingCount || (recommendation?.tone === 'ready' ? 0 : 1),
    recommendation,
    expectedRevenueImpact: buildExpectedRevenueImpact(breakdown, fleet, realFleet),
    confidenceLabel: buildConfidenceLabel(realSyncStatus, realFleet),
    confidenceScore: realSyncStatus?.state === 'success' && realFleet.length > 0 ? 91 : realFleet.length > 0 ? 78 : 62,
  };
}

function vehicleOperationalLine(vehicle, index) {
  const battery = vehicleBatteryPercent(vehicle);
  const status = vehicleStateLabel(vehicle);
  const revenue = Math.round(Number(vehicle.revenue) || 0);
  const parts = [];

  if (status === 'Charging') parts.push('Charging');
  else if (status === 'Offline' || status === 'Asleep') parts.push('Offline');
  else if (String(vehicle.status || '').toUpperCase().includes('SERVICE')
    || String(vehicle.status || '').toUpperCase().includes('PICK')
    || String(vehicle.status || '').toUpperCase().includes('ROUTE')) {
    parts.push('En Route');
  } else if (status === 'Parked') parts.push('Parked');
  else parts.push('Online');

  if (vehicle.city) parts.push(String(vehicle.city).split(',')[0].trim());
  if (battery !== null && status !== 'Offline' && status !== 'Asleep') parts.push(`${battery}%`);
  if (revenue > 0 && vehicle.isReal) parts.push(`$${revenue} today`);

  return {
    id: vehicle.id || `${index}`,
    name: fleetVehicleLabel(vehicle, index),
    status: parts[0],
    kind: vehicle.isReal ? 'Tesla' : 'Cybercab',
    line: parts.slice(1).join(' · ') || parts[0],
    battery,
    tone: battery !== null && battery < 20 ? 'issue' : status === 'Offline' || status === 'Asleep' ? 'issue' : status === 'Charging' ? 'warning' : 'ready',
    vehicle,
    ...getFleetPreviewMeta(vehicle),
  };
}

/** Fleet visibility rows — live operational picture below map. */
export function getFleetVisibilityRows(fleet, realFleet, limit = 4) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  return source.slice(0, limit).map(vehicleOperationalLine);
}

/** Map preview — vehicles with coordinates or synthetic positions. */
export function getMapPreviewVehicles(fleet, realFleet, limit = 6) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const withCoords = source.filter((vehicle) => {
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  const pool = withCoords.length ? withCoords : source;
  return pool.slice(0, limit).map((vehicle, index) => {
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    return {
      id: vehicle.id || `${index}`,
      name: fleetVehicleLabel(vehicle, index),
      left: hasCoords ? null : 18 + (index * 14) % 62,
      top: hasCoords ? null : 28 + (index * 17) % 48,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      tone: vehicleStateLabel(vehicle) === 'Charging' ? 'charging' : 'active',
      vehicle,
      isFeatured: index === 0,
    };
  });
}

export function getMapFeaturedVehicle(fleet, realFleet) {
  const rows = getFleetVisibilityRows(fleet, realFleet, 1);
  if (!rows.length) return null;

  const row = rows[0];
  const status = String(row.vehicle?.status || '').toUpperCase();
  let event = 'Active now';
  if (status.includes('PICK') || status.includes('ROUTE') || status.includes('SERVICE')) {
    event = 'Picked up 12m ago';
  } else if (vehicleStateLabel(row.vehicle) === 'Charging') {
    event = 'Charging now';
  }

  return {
    name: row.name,
    event,
    isReal: Boolean(row.vehicle?.isReal),
  };
}
