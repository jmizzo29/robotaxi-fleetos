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
    const battery = Math.round(Number(vehicle.battery ?? vehicle.battery_level));
    return {
      title: 'Low battery alert',
      subtitle: `${vehicleDisplayName(vehicle)} · ${battery}%`,
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
      return {
        title: `Charge ${vehicleDisplayName(chargeCandidate)} after 11 PM`,
        subtitle: 'Off-peak rates tonight',
        route: 'charging',
      };
    }
  }
  return null;
}

function findIdleVehicleRecommendation(realFleet) {
  const idle = realFleet.find((v) => {
    const utilization = Number(v.utilization);
    return Number.isFinite(utilization) && utilization < 35;
  });
  if (!idle) return null;
  return {
    title: `${vehicleDisplayName(idle)} underutilized`,
    subtitle: 'Consider listing or charging',
    route: 'fleet',
  };
}

/** One fleet recommendation — alert, charging, idle, then all clear. */
export function getFleetRecommendation(realFleet, realSyncStatus) {
  const alert = findFleetAlert(realFleet, realSyncStatus);
  if (alert) return alert;

  const charging = findChargingRecommendation(realFleet);
  if (charging) return charging;

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
