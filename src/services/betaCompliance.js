const ACCESS_KEY = 'fleetos.betaAccess.v1';
const CONSENT_KEY = 'fleetos.teslaConsent.v1';

const DATA_KEYS = [
  'fleetos.assetRecords.v1',
  'fleetos.location-history-v1',
  'fleetos.memory.v1',
  'fleetos.revenueRecords.v1',
];

function inviteCode() {
  return import.meta.env.VITE_BETA_INVITE_CODE || 'FLEETOS-BETA';
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

export function revokeTeslaConsent() {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('fleetos-compliance-updated'));
}

export function canUseTeslaTelemetry() {
  return hasBetaAccess() && hasTeslaConsent();
}

function apiBase() {
  const isLocalBrowser = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

export async function deleteUserData() {
  DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  await Promise.allSettled([
    fetch(`${apiBase()}/memory`, { method: 'DELETE' }),
    fetch(`${apiBase()}/assets`, { method: 'DELETE' }),
    fetch(`${apiBase()}/revenue`, { method: 'DELETE' }),
  ]);
  window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: {} }));
  window.dispatchEvent(new CustomEvent('fleetos-revenue-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('fleetos-location-history-updated'));
}
