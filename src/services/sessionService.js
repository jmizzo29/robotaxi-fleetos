import { fetchApiJson } from './apiClient';
import { clearTeslaConnectionLocalState } from './betaCompliance';
import { logTeslaDisconnect, mapTeslaDisconnectError } from './teslaDisconnectUtils';

export async function getFleetOsSession() {
  return fetchApiJson('/auth/session');
}

/** Fail closed: uncertain session errors must not open Command with a fake fleet. */
export function sessionCheckFromError(error) {
  void error;
  return 'guest';
}

export function sessionCheckFromPayload(session) {
  return session?.authenticated ? 'authed' : 'guest';
}

export async function registerFleetOsAccount(payload) {
  return fetchApiJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginFleetOsAccount(payload) {
  return fetchApiJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestFleetOsMagicLink(payload) {
  return fetchApiJson('/auth/magic/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFleetOsProfile(payload) {
  return fetchApiJson('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function logoutFleetOsAccount() {
  return fetchApiJson('/auth/logout', { method: 'POST' });
}

export async function getFleetOsBillingStatus() {
  return fetchApiJson('/billing/status');
}

export async function disconnectTeslaForUser() {
  logTeslaDisconnect('click', { route: 'account' });

  try {
    const result = await fetchApiJson('/tesla/disconnect', { method: 'POST' });
    logTeslaDisconnect('api_success', {
      hadActiveConnection: result.hadActiveConnection,
      teslaConnected: result.teslaConnected,
      message: result.message,
    });
    clearTeslaConnectionLocalState();
    return result;
  } catch (error) {
    logTeslaDisconnect('api_failure', {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    const mapped = mapTeslaDisconnectError(error);
    const wrapped = new Error(mapped);
    wrapped.status = error.status;
    wrapped.code = error.code;
    throw wrapped;
  }
}
