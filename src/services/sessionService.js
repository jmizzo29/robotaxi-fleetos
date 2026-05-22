import { fetchApiJson } from './apiClient';

export async function getFleetOsSession() {
  return fetchApiJson('/auth/session');
}

export async function disconnectTeslaForUser() {
  return fetchApiJson('/tesla/disconnect', { method: 'POST' });
}
