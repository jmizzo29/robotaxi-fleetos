import { fetchApiJson } from './apiClient';

export async function getFleetOsSession() {
  return fetchApiJson('/auth/session');
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
  return fetchApiJson('/tesla/disconnect', { method: 'POST' });
}
