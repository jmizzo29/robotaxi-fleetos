import { getApiBase } from './apiClient';
import { getAuthToken } from './authTokenStore';

const ACCESS_KEY = 'fleetos.betaAccess.v1';
const CONSENT_KEY = 'fleetos.teslaConsent.v1';

const DATA_KEYS = [
  'fleetos.location-history-v1',
];

function inviteCode() {
  return import.meta.env.VITE_BETA_INVITE_CODE || 'RoboAgent-BETA';
}

export function hasBetaAccess() {
  return localStorage.getItem(ACCESS_KEY) === 'granted';
}

export function verifyBetaInvite(code) {
  const ok = String(code || '').trim().toUpperCase() === inviteCode().toUpperCase();
  if (ok) {
    localStorage.setItem(ACCESS_KEY, 'granted');
    window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
  }
  return ok;
}

export function hasTeslaConsent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return Boolean(parsed?.acceptedAt);
  } catch {
    return false;
  }
}

export function acceptTeslaConsent() {
  const consent = {
    acceptedAt: new Date().toISOString(),
    version: 'beta-2026-05-22',
    telemetry: ['VIN', 'precise location', 'battery', 'odometer', 'charging', 'vehicle state'],
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
  return consent;
}

export async function revokeTeslaConsent() {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
}

/** Clear local Tesla consent without calling the API. */
export function clearTeslaConnectionLocalState() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Storage may be unavailable.
  }
  window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
  window.dispatchEvent(new CustomEvent('fleetos-tesla-disconnected'));
}

export function canUseTeslaTelemetry() {
  return hasBetaAccess() && hasTeslaConsent();
}

// Clears local beta access + consent flags (e.g. on sign-out) without
// touching the server-side Tesla connection.
export function clearLocalComplianceState() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Storage may be unavailable (private browsing); nothing to clear.
  }
  window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
}

export async function deleteUserData() {
  DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  const apiBase = getApiBase();
  const token = await getAuthToken();
  const response = await fetch(`${apiBase}/auth/delete-data`, {
    method: 'DELETE',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Delete request failed with ${response.status}`);
  }
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: {} }));
  window.dispatchEvent(new CustomEvent('fleetos-revenue-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('fleetos-location-history-updated'));
}
