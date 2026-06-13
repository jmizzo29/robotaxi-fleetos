import {
  getFleetPreviewMeta,
  getFleetRecommendation,
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

function buildPlanSummary(recommendation, breakdown) {
  const parts = [];
  if (breakdown.pricing > 0) parts.push('adjust pricing');
  if (breakdown.charging > 0 || recommendation?.route === 'charging') parts.push('charge after 11 PM');
  if (breakdown.maintenance > 0) parts.push('clean before pickup');
  if (recommendation?.title && recommendation.tone !== 'ready') {
    parts.unshift(recommendation.title.replace(/^Charge /i, 'charge ').toLowerCase());
  }
  if (!parts.length) return 'Fleet is stable — review AI suggestions before peak hours.';
  return parts.slice(0, 3).join(', ').replace(/^./, (c) => c.toUpperCase()) + '.';
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

/** Today's AI Plan — operational brief, not analytics. */
export function getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue = []) {
  const snapshotSource = realFleet.length > 0 ? realFleet : fleet;
  const recommendation = getFleetRecommendation(snapshotSource, realSyncStatus);
  const breakdown = getOpenActionsBreakdown(commandQueue, fleet, realFleet);
  const pendingCount = Math.max(
    commandQueue.length,
    breakdown.pricing + breakdown.maintenance + breakdown.charging,
  );

  return {
    summary: buildPlanSummary(recommendation, breakdown),
    checklist: buildPlanChecklist(fleet, realFleet, recommendation, breakdown),
    pendingCount: pendingCount || (recommendation?.tone === 'ready' ? 0 : 1),
    recommendation,
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
