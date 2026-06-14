import { getCommandAiPlan } from './commandHomeUtils';
import {
  getCommandFleetStatusStrip,
  getCommandOperationalSource,
  vehicleBatteryPercent,
  vehicleStateLabel,
} from './vehicleDisplayUtils';
import { getMonumentAction } from './monumentUtils';

function cabLabel(vehicle, index) {
  const id = String(vehicle?.id || vehicle?.name || '');
  const carMatch = id.match(/CAR-(\d+)/i);
  if (carMatch) return `CAB-${carMatch[1].padStart(2, '0')}`;
  const match = id.match(/\d+/);
  if (match) return `CAB-${String(match[0]).padStart(2, '0')}`;
  return `CAB-${String(index + 1).padStart(2, '0')}`;
}

function ownerCityLabel(fleet = []) {
  const city = fleet.find((vehicle) => vehicle.city)?.city;
  return city ? String(city).split(',')[0].trim() : 'Orlando';
}

function vehicleKey(vehicle, index) {
  return vehicle?.vin || vehicle?.id || `vehicle-${index}`;
}

function needsCharge(vehicle) {
  const battery = vehicleBatteryPercent(vehicle);
  const state = vehicleStateLabel(vehicle);
  if (state === 'Charging') return false;
  return battery !== null && battery < 55;
}

function isAlertVehicle(vehicle) {
  const state = vehicleStateLabel(vehicle);
  const raw = String(vehicle?.status || '').toUpperCase();
  return state === 'Offline' || state === 'Asleep' || raw.includes('SERVICE');
}

function needsPlan(vehicle) {
  if (needsCharge(vehicle)) return true;
  const state = vehicleStateLabel(vehicle);
  const raw = String(vehicle?.status || '').toLowerCase();
  return state === 'Parked' || raw.includes('park');
}

function formatUplift(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `+$${Math.round(value)}`;
}

function buildPlanRow(vehicle, index) {
  const cab = cabLabel(vehicle, index);
  const battery = vehicleBatteryPercent(vehicle);

  if (needsCharge(vehicle)) {
    const target = Math.max(70, Math.min(90, (battery || 38) + 44));
    return { cab, event: 'Charge first', value: `${target}%`, tone: 'alert', vehicle };
  }

  const raw = String(vehicle?.status || '').toUpperCase();
  const zone = raw.includes('MCO') || raw.includes('AIRPORT') ? 'MCO' : ownerCityLabel([vehicle]);
  const uplift = 72 + ((index + 1) * 17) % 48;
  return { cab, event: `Stage ${zone}`, value: formatUplift(uplift), tone: 'positive', vehicle };
}

function buildChargeRow(vehicle, index) {
  const cab = cabLabel(vehicle, index);
  const battery = vehicleBatteryPercent(vehicle);
  return {
    cab,
    event: 'Supercharger · 4.2 mi',
    value: battery !== null ? `${battery}%` : '—',
    tone: 'alert',
    vehicle,
  };
}

function buildAlertRow(vehicle, index) {
  const cab = cabLabel(vehicle, index);
  const state = vehicleStateLabel(vehicle);
  const raw = String(vehicle?.status || '').toUpperCase();

  if (state === 'Offline' || state === 'Asleep') {
    return { cab, event: 'Offline unexpectedly', value: 'Review', tone: 'alert', vehicle };
  }
  if (raw.includes('SERVICE')) {
    return { cab, event: 'Service hold', value: 'Clear', tone: 'alert', vehicle };
  }

  return { cab, event: 'Needs attention', value: 'Review', tone: 'alert', vehicle };
}

/** Convoy counts for O3 Plan tab tiles. */
export function getOperationsConvoy(
  fleet,
  realFleet,
  totalEarnings,
  syncState,
  realSyncStatus,
  commandQueue = [],
) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const strip = getCommandFleetStatusStrip(fleet, realFleet, totalEarnings, syncState);
  const total = source.length || fleet.length || 0;
  const plan = new Set();
  const charge = new Set();
  const alert = new Set();
  const action = new Set();

  source.forEach((vehicle, index) => {
    const key = vehicleKey(vehicle, index);
    if (needsPlan(vehicle)) {
      plan.add(key);
      action.add(key);
    }
    if (needsCharge(vehicle)) {
      charge.add(key);
      action.add(key);
    }
    if (isAlertVehicle(vehicle)) {
      alert.add(key);
      action.add(key);
    }
  });

  let planCount = plan.size;
  let chargeCount = charge.size;
  let alertCount = alert.size;
  let actionCount = action.size;

  const aiPlan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings);

  if (planCount === 0 && aiPlan.pendingCount > 0) {
    planCount = Math.min(Math.max(aiPlan.pendingCount, 1), Math.max(total, 1));
    actionCount = Math.max(actionCount, Math.min(planCount, total || planCount));
  }

  if (actionCount === 0 && total > 0) {
    planCount = Math.max(planCount, Math.min(2, total));
    chargeCount = Math.max(chargeCount, Math.min(2, Math.max(Number(strip?.charging?.value) || 0, 1)));
    alertCount = Math.max(alertCount, Math.min(1, Math.max(Number(strip?.offline?.value) + Number(strip?.service?.value) || 0, 1)));
    actionCount = Math.min(Math.max(planCount, 1) + alertCount, total);
  }

  return {
    total,
    actionCount: actionCount || Math.min(3, total),
    plan: planCount,
    charge: chargeCount,
    alert: alertCount,
    city: ownerCityLabel(fleet),
    strip,
    planSummary: aiPlan,
  };
}

export function getOperationsHero(convoy, tab = 'plan') {
  const { total, actionCount, charge, alert, city } = convoy;

  if (tab === 'charge') {
    return {
      label: 'CHARGE',
      amount: String(charge),
      subline: `vehicles below 55% · ${city}`,
      labelColor: null,
      amountColor: 'projected',
    };
  }

  if (tab === 'alerts') {
    return {
      label: 'ALERTS',
      amount: String(alert),
      subline: `needs attention · ${city}`,
      labelColor: null,
      amountColor: 'projected',
    };
  }

  return {
    label: 'OPERATIONS',
    amount: `${actionCount}/${total || actionCount}`,
    subline: `need action · ${city}`,
    labelColor: null,
    amountColor: 'action',
  };
}

export function getOperationsFooterLine(convoy, tab, actionDone = '') {
  if (actionDone) return actionDone;

  const { planSummary, strip } = convoy;
  const offline = Number(strip?.offline?.value) || 0;

  if (tab === 'charge') {
    return 'Route both before 6 PM demand window.';
  }

  if (tab === 'alerts') {
    return offline > 0
      ? 'Resolve offline CAB before evening peak.'
      : 'Review alerts before tonight\'s plan.';
  }

  const summary = planSummary?.summary || 'Stage vehicles for tonight\'s demand window.';
  return summary.endsWith('.') ? summary : `${summary}.`;
}

export function getOperationsAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings) {
  return getMonumentAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings);
}

export function getPlanDetailPayload(fleet, realFleet, totalEarnings, syncState) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const rows = source
    .filter((vehicle, index) => needsPlan(vehicle) || index < 3)
    .slice(0, 6)
    .map((vehicle, index) => buildPlanRow(vehicle, index));

  const uplift = rows.reduce((sum, row) => {
    const match = String(row.value).match(/\$(\d+)/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);

  return {
    title: 'Tonight',
    amount: String(rows.length),
    subtitle: `vehicles staged · ${formatUplift(uplift)} uplift`,
    rows,
  };
}

export function getChargeLedgerRows(fleet, realFleet, totalEarnings, syncState, limit = 4) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  return source
    .filter(needsCharge)
    .slice(0, limit)
    .map((vehicle, index) => buildChargeRow(vehicle, index));
}

export function getAlertsLedgerRows(fleet, realFleet, totalEarnings, syncState, limit = 4) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const rows = source
    .filter(isAlertVehicle)
    .slice(0, limit)
    .map((vehicle, index) => buildAlertRow(vehicle, index));

  if (rows.length > 0) return rows;

  return [
    { cab: 'MCO', event: 'Surge +18% after 4 PM', value: 'Stage', tone: 'positive' },
  ];
}

export function routeToOperationsTab(route) {
  if (route === 'charging') return 'charge';
  if (route === 'alerts') return 'alerts';
  return 'plan';
}
