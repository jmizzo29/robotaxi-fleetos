import { getApiBase } from './apiClient';

const API_BASE = getApiBase();

export function getTeslaLoginUrl(returnRoute = 'tesla') {
  const returnTo = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#/${returnRoute}`
    : `/#/${returnRoute}`;
  return `${API_BASE}/tesla/login?returnTo=${encodeURIComponent(returnTo)}`;
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}?ts=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with ${response.status}`);
  }

  return data;
}

export async function getTeslaSyncHealth() {
  try {
    return await fetchJson('/tesla/diagnostics');
  } catch (diagnosticsError) {
    const health = await fetchJson('/health');
    return {
      backend: { ok: Boolean(health.ok), runtime: 'health-fallback' },
      credentials: {
        ok: Boolean(health.teslaConfigured),
        clientId: Boolean(health.envFingerprint?.clientId || health.teslaConfigured),
        refreshToken: Boolean(health.envFingerprint?.refreshToken || health.hasRefreshToken || health.teslaConfigured),
        clientSecret: Boolean(health.hasClientSecret),
        redirectUri: health.redirectUri,
      },
      fleetApiBase: health.fleetApiBase,
      partnerDomain: health.partnerDomain,
      token: {
        ok: null,
        message: diagnosticsError.message,
      },
      vehicles: null,
      location: null,
    };
  }
}
