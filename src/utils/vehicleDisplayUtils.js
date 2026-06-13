export function lastSyncedLabel(isoTimestamp, prefix = 'Last synced') {
  if (!isoTimestamp) return null;
  const elapsedMs = Date.now() - new Date(isoTimestamp).getTime();
  if (Number.isNaN(elapsedMs)) return null;
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return `${prefix} just now`;
  if (minutes === 1) return `${prefix} 1 minute ago`;
  if (minutes < 60) return `${prefix} ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return `${prefix} ${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export function vehicleStateLabel(vehicle) {
  const raw = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  if (raw.includes('CHARG')) return 'Charging';
  if (raw.includes('ASLEEP') || raw.includes('SLEEP')) return 'Asleep';
  if (raw.includes('OFFLINE')) return 'Offline';
  if (raw.includes('PARK')) return 'Parked';
  if (raw.includes('ONLINE')) return 'Online';
  return raw ? raw.charAt(0) + raw.slice(1).toLowerCase() : 'Online';
}

export function fleetInsightLine(realVehicles) {
  if (realVehicles.some((v) => vehicleStateLabel(v) === 'Charging')) {
    return 'Charging session active';
  }
  const lowBattery = realVehicles.filter((v) => Number.isFinite(Number(v.battery)) && Number(v.battery) < 20);
  if (lowBattery.length > 0) {
    return `${lowBattery.length} vehicle${lowBattery.length === 1 ? '' : 's'} low on battery`;
  }
  return 'Telemetry active';
}

export function vehicleDisplayName(vehicle) {
  return vehicle?.name || vehicle?.display_name || 'Your Tesla';
}

function isVehicleOnline(vehicle) {
  const state = vehicleStateLabel(vehicle);
  return state !== 'Offline' && state !== 'Asleep';
}

/** Revenue hero only when real fleet is synced and at least one vehicle has positive revenue. */
export function hasTrustedFleetRevenue(realFleet, totalEarnings, syncState) {
  if (syncState !== 'success') return false;
  if (!realFleet.length) return false;
  const revenue = Math.round(totalEarnings || 0);
  if (revenue <= 0) return false;
  return realFleet.some((vehicle) => Math.round(vehicle.revenue || 0) > 0);
}

export function formatFleetDollars(amount) {
  const num = Math.round(amount || 0);
  return `$${num.toLocaleString()}`;
}

function getFleetOnlineHero(realFleet) {
  const online = realFleet.filter(isVehicleOnline).length;
  const total = realFleet.length;
  const offline = total - online;
  return {
    value: `${online} / ${total}`,
    label: 'Fleet Online',
    sub: offline > 0 ? `${offline} vehicle${offline === 1 ? '' : 's'} offline` : null,
  };
}

/** Answers: How much is my fleet earning? */
export function getFleetEarningsSummary(realFleet, totalEarnings, syncState) {
  if (syncState === 'loading') {
    return { amount: '—', context: 'Loading fleet earnings…' };
  }
  if (hasTrustedFleetRevenue(realFleet, totalEarnings, syncState)) {
    return {
      amount: formatFleetDollars(totalEarnings),
      context: 'Earned today across your fleet',
    };
  }
  if (syncState === 'success' && realFleet.length > 0) {
    return { amount: '—', context: 'No earnings recorded yet today' };
  }
  return { amount: '—', context: 'Connect Tesla to track fleet revenue' };
}

/** Answers: Are my vehicles available and healthy? */
export function getFleetAvailabilitySummary(fleet, realFleet, snapshot, health) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const total = source.length;
  const ready = snapshot.online + snapshot.charging;

  let summary;
  if (!total) {
    summary = 'Connect vehicles to monitor availability';
  } else if (snapshot.offline === 0 && snapshot.alerts === 0) {
    summary = total === 1
      ? 'Your vehicle is available'
      : `${ready} of ${total} vehicles available`;
  } else if (snapshot.offline > 0 && snapshot.alerts > 0) {
    summary = `${snapshot.offline} unavailable · ${snapshot.alerts} alert${snapshot.alerts === 1 ? '' : 's'}`;
  } else if (snapshot.offline > 0) {
    summary = `${snapshot.offline} vehicle${snapshot.offline === 1 ? '' : 's'} unavailable`;
  } else {
    summary = `${snapshot.alerts} alert${snapshot.alerts === 1 ? '' : 's'} need attention`;
  }

  return { summary, health, total, ready };
}

/** Fleet overview metrics for Command home — active, revenue, utilization. */
export function getFleetOverviewMetrics(fleet, realFleet, totalEarnings, syncState) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  const active = source.filter(isVehicleOnline).length;
  const total = source.length;
  const utilValues = source
    .map((vehicle) => Number(vehicle.utilization))
    .filter(Number.isFinite);
  const utilization = utilValues.length
    ? Math.round(utilValues.reduce((sum, value) => sum + value, 0) / utilValues.length)
    : null;

  let revenueDisplay = '—';
  if (hasTrustedFleetRevenue(realFleet, totalEarnings, syncState)) {
    revenueDisplay = formatFleetDollars(totalEarnings);
  }

  return {
    active,
    total,
    revenueDisplay,
    utilization,
    syncState: syncState ?? 'idle',
    hasFleet: total > 0,
  };
}

/** Fleet health summary — score optional, simple status label. */
export function getFleetHealthSummary(fleet, realFleet, snapshot) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  if (!source.length) {
    return { score: null, label: 'Awaiting fleet', tone: 'neutral' };
  }

  const scores = source
    .map((vehicle) => Number(vehicle.maintenanceScore))
    .filter(Number.isFinite);
  const score = scores.length
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : null;

  if (snapshot.alerts > 0 || snapshot.offline > 0) {
    return { score, label: 'Attention Needed', tone: 'caution' };
  }
  if (score !== null && score >= 90) {
    return { score, label: 'Excellent', tone: 'ready' };
  }
  if (score !== null && score >= 75) {
    return { score, label: 'Good', tone: 'ready' };
  }
  if (score !== null) {
    return { score, label: 'Fair', tone: 'neutral' };
  }
  return { score: null, label: 'Excellent', tone: 'ready' };
}

function fleetVehicleLabel(vehicle, index) {
  const name = vehicleDisplayName(vehicle);
  if (name && name !== 'Your Tesla') return name;
  return `Vehicle ${index + 1}`;
}

function vehicleIndexInFleet(vehicle, fleet) {
  const idx = fleet.indexOf(vehicle);
  return idx >= 0 ? idx : 0;
}

/** First N vehicles for home preview — status only, no battery hero. */
export function getFleetPreviewRows(fleet, realFleet, limit = 3) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  return source.slice(0, limit).map((vehicle, index) => ({
    id: vehicle.id || `${index}`,
    name: fleetVehicleLabel(vehicle, index),
    status: vehicleStateLabel(vehicle),
  }));
}

/** Hybrid hero — revenue when trusted and meaningful; otherwise fleet online. Never shows $0. */
export function getFleetHeroMetric({ realFleet, totalEarnings, syncState }) {
  if (syncState === 'loading') {
    return { value: '—', label: 'Fleet', sub: 'Connecting…' };
  }
  if (syncState === 'error' || syncState === 'idle') {
    return { value: '—', label: 'Fleet', sub: syncState === 'idle' ? 'Sync needed' : 'Sync failed' };
  }
  if (realFleet.length === 0) {
    return { value: '—', label: 'Fleet', sub: 'Connect Tesla' };
  }

  if (hasTrustedFleetRevenue(realFleet, totalEarnings, syncState)) {
    return {
      value: formatFleetDollars(totalEarnings),
      label: "Today's Revenue",
      sub: null,
    };
  }

  return getFleetOnlineHero(realFleet);
}

/** Counts for snapshot pills — real vehicles only. */
export function getFleetSnapshotCounts(realFleet) {
  const counts = { online: 0, charging: 0, offline: 0, alerts: 0 };
  for (const vehicle of realFleet) {
    const state = vehicleStateLabel(vehicle);
    const battery = Number(vehicle.battery ?? vehicle.battery_level);
    if (state === 'Charging') counts.charging += 1;
    else if (state === 'Offline' || state === 'Asleep') counts.offline += 1;
    else counts.online += 1;
    if (Number.isFinite(battery) && battery < 20) counts.alerts += 1;
  }
  return counts;
}

function findFleetAlert(realFleet, realSyncStatus) {
  const syncState = realSyncStatus?.state;
  const isBillingError = realSyncStatus?.code === 'BILLING_REQUIRED' || realSyncStatus?.httpStatus === 402;

  if (syncState === 'error') {
    if (isBillingError) {
      return { title: 'Plan upgrade needed', subtitle: 'Additional vehicles require a paid plan', route: 'account' };
    }
    return { title: 'Vehicle sync failed', subtitle: 'Retry to refresh fleet data', route: 'fleet', action: 'retry' };
  }
  if (syncState === 'idle') {
    return { title: 'Sync needed', subtitle: 'Enable telemetry to see fleet status', route: 'settings', action: 'retry' };
  }
  if (realFleet.length === 0) {
    return { title: 'Connect your fleet', subtitle: 'Link Tesla to begin', route: 'account' };
  }

  const offline = realFleet.filter((v) => {
    const state = vehicleStateLabel(v);
    return state === 'Offline' || state === 'Asleep';
  });
  if (offline.length === 1) {
    return {
      title: 'Vehicle offline',
      subtitle: `${vehicleDisplayName(offline[0])} needs attention`,
      route: 'fleet',
    };
  }
  if (offline.length > 1) {
    return {
      title: `${offline.length} vehicles offline`,
      subtitle: 'Tap to review fleet',
      route: 'fleet',
    };
  }

  const lowBattery = realFleet.filter((v) => {
    const battery = Number(v.battery ?? v.battery_level);
    return Number.isFinite(battery) && battery < 20;
  });
  if (lowBattery.length === 1) {
    const vehicle = lowBattery[0];
    const index = vehicleIndexInFleet(vehicle, realFleet);
    return {
      title: `Charge ${fleetVehicleLabel(vehicle, index)}`,
      subtitle: 'Battery below 20%',
      route: 'charging',
    };
  }
  if (lowBattery.length > 1) {
    return {
      title: `${lowBattery.length} vehicles low on battery`,
      subtitle: 'Tap to review fleet',
      route: 'fleet',
    };
  }

  return null;
}

function findChargingRecommendation(realFleet) {
  const hour = new Date().getHours();
  if (hour >= 18) {
    const chargeCandidate = realFleet.find((v) => {
      const battery = Number(v.battery ?? v.battery_level);
      return Number.isFinite(battery) && battery < 80 && vehicleStateLabel(v) !== 'Charging';
    });
    if (chargeCandidate) {
      const index = vehicleIndexInFleet(chargeCandidate, realFleet);
      return {
        title: `Charge ${fleetVehicleLabel(chargeCandidate, index)}`,
        subtitle: 'Off-peak rates tonight',
        route: 'charging',
      };
    }
  }
  return null;
}

function findServiceRecommendation(realFleet) {
  const candidate = realFleet.find((vehicle) => {
    const score = Number(vehicle.maintenanceScore);
    return Number.isFinite(score) && score < 70;
  });
  if (!candidate) return null;
  const index = vehicleIndexInFleet(candidate, realFleet);
  return {
    title: `Schedule Tire Service`,
    subtitle: fleetVehicleLabel(candidate, index),
    route: 'health',
  };
}

function findIdleVehicleRecommendation(realFleet) {
  const idle = realFleet.find((v) => {
    const utilization = Number(v.utilization);
    return Number.isFinite(utilization) && utilization < 35;
  });
  if (!idle) return null;
  const index = vehicleIndexInFleet(idle, realFleet);
  return {
    title: `Review ${fleetVehicleLabel(idle, index)}`,
    subtitle: 'Underutilized today',
    route: 'fleet',
  };
}

/** One fleet recommendation — alert, charging, idle, then all clear. */
export function getFleetRecommendation(realFleet, realSyncStatus) {
  const alert = findFleetAlert(realFleet, realSyncStatus);
  if (alert) return alert;

  const charging = findChargingRecommendation(realFleet);
  if (charging) return charging;

  const service = findServiceRecommendation(realFleet);
  if (service) return service;

  const idle = findIdleVehicleRecommendation(realFleet);
  if (idle) return idle;

  return { title: 'All clear', subtitle: 'No action needed today', route: 'fleet' };
}

/** One mobile-home recommendation from existing vehicle fields — no API calls. */
export function getHomeRecommendation(vehicle) {
  if (!vehicle) return null;

  const state = vehicleStateLabel(vehicle);
  const battery = Number(vehicle.battery ?? vehicle.battery_level);

  if (state === 'Charging') {
    return { title: 'Charging now', subtitle: 'Session in progress', route: 'fleet' };
  }
  if (Number.isFinite(battery) && battery < 20) {
    return {
      title: 'Charge soon',
      subtitle: `Battery at ${Math.round(battery)}%`,
      route: 'charging',
    };
  }
  const hour = new Date().getHours();
  if (hour >= 18 && Number.isFinite(battery) && battery < 80) {
    return {
      title: 'Charge after 10 PM',
      subtitle: 'Off-peak rates tonight',
      route: 'charging',
    };
  }
  return { title: 'All good', subtitle: 'Telemetry active', route: 'ai' };
}
