import { fetchApiJson } from './apiClient';

export async function getTeslaChargeHistory(vin) {
  if (!vin) {
    throw new Error('A Tesla VIN is required to load charge history.');
  }
  return fetchApiJson(`/vehicles/${encodeURIComponent(vin)}/charging/history`);
}

export async function sendTeslaChargingCommand({ vin, action, percent } = {}) {
  if (!vin) {
    throw new Error('A Tesla VIN is required to send a charging command.');
  }
  return fetchApiJson(`/vehicles/${encodeURIComponent(vin)}/charging/command`, {
    method: 'POST',
    body: JSON.stringify({ action, percent }),
  });
}

export const MISSING_CHARGING_SCOPE_CODE = 'MISSING_CHARGING_SCOPE';
export const MISSING_CHARGING_SCOPE_MESSAGE = 'Charging history needs Tesla charging permission. Connect Tesla again to grant it. The app is not broken.';

export function isMissingChargingScope(error) {
  return error?.code === MISSING_CHARGING_SCOPE_CODE
    || /vehicle_charging_cmds|missing scope|connect tesla again/i.test(error?.message || '');
}
