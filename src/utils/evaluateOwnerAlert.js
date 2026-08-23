export const OWNER_ALERT_TRIGGERS = {
  BATTERY_LOW: 'battery_low',
  CHARGE_FAILED: 'charge_failed',
  VEHICLE_UNAVAILABLE: 'vehicle_unavailable',
};

export const OWNER_ALERT_DEFAULTS = {
  batteryLowPercent: 15,
  unavailableMs: 6 * 60 * 60 * 1000,
  cooldownMs: 4 * 60 * 60 * 1000,
};

const CHARGING_ACTIVE = new Set(['charging', 'starting']);
const CHARGE_FAILED_STATES = new Set(['error', 'faulted', 'nopower']);
const CHARGE_STOPPED_STATES = new Set(['stopped']);
const WAS_CHARGING = new Set(['charging', 'starting']);
const NOW_STOPPED = new Set(['stopped', 'disconnected', 'error', 'faulted', 'nopower']);

function normalizeChargingState(value) {
  return String(value || '').trim().toLowerCase();
}

export function ownerAlertVehicleName(vehicle) {
  return vehicle?.display_name || vehicle?.name || vehicle?.vin || 'Tesla';
}

export function ownerAlertBatteryLevel(vehicle) {
  const n = Number(
    vehicle?.battery
    ?? vehicle?.battery_level
    ?? vehicle?.charge_state?.battery_level
    ?? vehicle?.raw?.battery
    ?? vehicle?.raw?.charge_state?.battery_level,
  );
  return Number.isFinite(n) ? n : null;
}

export function ownerAlertChargingState(vehicle) {
  return normalizeChargingState(
    vehicle?.chargingState
    || vehicle?.charging_state
    || vehicle?.charge_state?.charging_state
    || vehicle?.raw?.chargingState
    || vehicle?.raw?.charge_state?.charging_state,
  );
}

function chargeLimit(vehicle) {
  const n = Number(
    vehicle?.chargeLimit
    ?? vehicle?.charge_limit_soc
    ?? vehicle?.charge_state?.charge_limit_soc
    ?? vehicle?.raw?.chargeLimit
    ?? vehicle?.raw?.charge_state?.charge_limit_soc,
  );
  return Number.isFinite(n) ? n : null;
}

function lastSyncedAt(vehicle) {
  const raw = vehicle?.last_synced_at || vehicle?.lastSyncedAt || vehicle?.syncedAt;
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function vehicleState(vehicle) {
  return String(vehicle?.state || vehicle?.raw?.state || '').trim().toLowerCase();
}

export function isActivelyCharging(vehicle) {
  return CHARGING_ACTIVE.has(ownerAlertChargingState(vehicle));
}

export function evaluateBatteryLow(vehicle, options = {}) {
  const threshold = options.batteryLowPercent ?? OWNER_ALERT_DEFAULTS.batteryLowPercent;
  const battery = ownerAlertBatteryLevel(vehicle);
  if (battery == null || battery > threshold) return null;
  if (isActivelyCharging(vehicle)) return null;

  return {
    trigger: OWNER_ALERT_TRIGGERS.BATTERY_LOW,
    action: 'charge',
    title: 'Battery critically low',
    body: `${ownerAlertVehicleName(vehicle)} is at ${Math.round(battery)}% and not charging.`,
    primaryLabel: 'Charge',
  };
}

function historyLooksFailed(history) {
  if (!history) return false;
  const state = normalizeChargingState(
    history.chargingState || history.chargeStopReason || history.status || history.charging_state,
  );
  if (CHARGE_FAILED_STATES.has(state)) return true;
  return /fail|error|fault|interrupted|unplug/i.test(
    String(history.chargeStopReason || history.status || history.chargingState || ''),
  );
}

export function evaluateChargeFailed(vehicle, options = {}) {
  const state = ownerAlertChargingState(vehicle);
  if (state === 'complete' || CHARGING_ACTIVE.has(state)) return null;

  const battery = ownerAlertBatteryLevel(vehicle);
  const limit = chargeLimit(vehicle);
  const previous = normalizeChargingState(
    options.previousChargingState || vehicle?.previousChargingState,
  );
  const history = options.latestChargeSession || vehicle?.latestChargeSession || null;

  let failed = CHARGE_FAILED_STATES.has(state);
  if (!failed && CHARGE_STOPPED_STATES.has(state) && battery != null) {
    const target = limit ?? 80;
    failed = battery < target - 2;
  }
  if (!failed && WAS_CHARGING.has(previous) && NOW_STOPPED.has(state)) {
    failed = true;
  }
  if (!failed && historyLooksFailed(history)) {
    failed = true;
  }
  if (!failed) return null;

  const failedHard = CHARGE_FAILED_STATES.has(state);
  return {
    trigger: OWNER_ALERT_TRIGGERS.CHARGE_FAILED,
    action: 'charge',
    title: failedHard ? 'Charge failed' : 'Charge stopped',
    body: `${ownerAlertVehicleName(vehicle)} ${failedHard ? 'failed to charge' : 'stopped charging unexpectedly'}${battery != null ? ` at ${Math.round(battery)}%` : ''}.`,
    primaryLabel: 'Charge',
  };
}

export function evaluateVehicleUnavailable(vehicle, now = new Date(), options = {}) {
  const windowMs = options.unavailableMs ?? OWNER_ALERT_DEFAULTS.unavailableMs;
  const synced = lastSyncedAt(vehicle);
  if (!synced) return null;

  const age = now.getTime() - synced.getTime();
  if (age < windowMs) return null;

  const state = vehicleState(vehicle) || 'offline';
  const hours = Math.max(1, Math.round(age / (60 * 60 * 1000)));

  return {
    trigger: OWNER_ALERT_TRIGGERS.VEHICLE_UNAVAILABLE,
    action: 'open',
    title: 'Vehicle not available',
    body: `${ownerAlertVehicleName(vehicle)} has been ${state} for about ${hours} hour${hours === 1 ? '' : 's'}. Last known state — the car was not woken to check.`,
    primaryLabel: 'Open car',
  };
}

export function evaluateOwnerAlert(vehicle, now = new Date(), options = {}) {
  if (!vehicle?.vin) return null;

  const hit = evaluateBatteryLow(vehicle, options)
    || evaluateChargeFailed(vehicle, options)
    || evaluateVehicleUnavailable(vehicle, now, options);

  if (!hit) return null;

  return {
    ...hit,
    vin: vehicle.vin,
    vehicleName: ownerAlertVehicleName(vehicle),
    battery: ownerAlertBatteryLevel(vehicle),
    chargingState: ownerAlertChargingState(vehicle),
    state: vehicleState(vehicle),
  };
}

export function pickPrimaryOwnerAlert(vehicles, now = new Date(), optionsByVin = {}) {
  const list = Array.isArray(vehicles) ? vehicles : [];
  for (const vehicle of list) {
    const options = typeof optionsByVin === 'function'
      ? optionsByVin(vehicle)
      : (optionsByVin[vehicle?.vin] || optionsByVin);
    const alert = evaluateOwnerAlert(vehicle, now, options);
    if (alert) return alert;
  }
  return null;
}

export function isOwnerAlertCooldownActive(lastSentAt, now = new Date(), options = {}) {
  if (!lastSentAt) return false;
  const date = lastSentAt instanceof Date ? lastSentAt : new Date(lastSentAt);
  if (Number.isNaN(date.getTime())) return false;
  const cooldown = options.cooldownMs ?? OWNER_ALERT_DEFAULTS.cooldownMs;
  return now.getTime() - date.getTime() < cooldown;
}

export function chargeConfirmFromAlert(alert, action = 'start') {
  const name = alert?.vehicleName || 'Tesla';
  return {
    title: 'Start charging?',
    body: `Ask Tesla to start charging ${name}. Tesla still decides whether the vehicle can charge.`,
    primaryLabel: 'Confirm',
    command: `Start charging ${name}`,
    teslaAction: { vin: alert.vin, action },
  };
}

export function ownerAlertNotificationUrl() {
  return '/#/overview';
}
