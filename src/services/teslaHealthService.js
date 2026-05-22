function resolveApiBase() {
  const configuredBase = import.meta.env.VITE_TESLA_API_BASE;
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  if (configuredBase && !configuredBase.includes('localhost') && !configuredBase.includes('127.0.0.1')) {
    return configuredBase;
  }

  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

const API_BASE = resolveApiBase();

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}?ts=${Date.now()}`, {
    cache: 'no-store',
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
