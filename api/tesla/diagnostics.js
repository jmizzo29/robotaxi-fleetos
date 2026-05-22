const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const TESLA_AUTH_URL = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const TESLA_REDIRECT_URI = process.env.TESLA_REDIRECT_URI || 'http://localhost:3001/callback';

function hasTeslaConfig() {
  return Boolean(process.env.TESLA_CLIENT_ID && process.env.TESLA_REFRESH_TOKEN);
}

async function refreshTeslaAccessToken() {
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.TESLA_CLIENT_ID,
    refresh_token: process.env.TESLA_REFRESH_TOKEN,
    redirect_uri: TESLA_REDIRECT_URI,
  });

  const response = await fetch(TESLA_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Token refresh failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function teslaRequest(path, accessToken) {
  const response = await fetch(`${DEFAULT_FLEET_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Tesla request failed with ${response.status}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const checks = {
    backend: { ok: true, runtime: 'vercel' },
    credentials: {
      ok: hasTeslaConfig(),
      clientId: Boolean(process.env.TESLA_CLIENT_ID),
      refreshToken: Boolean(process.env.TESLA_REFRESH_TOKEN),
      clientSecret: Boolean(process.env.TESLA_CLIENT_SECRET),
      redirectUri: TESLA_REDIRECT_URI,
    },
    fleetApiBase: DEFAULT_FLEET_API_BASE,
    partnerDomain: process.env.TESLA_PARTNER_DOMAIN || null,
    token: null,
    vehicles: null,
    location: null,
  };

  if (!hasTeslaConfig()) {
    res.status(200).json(checks);
    return;
  }

  try {
    const accessToken = await refreshTeslaAccessToken();
    checks.token = { ok: true };

    const payload = await teslaRequest('/api/1/vehicles', accessToken);
    const vehicles = payload.response || [];
    checks.vehicles = {
      ok: true,
      count: vehicles.length,
      onlineCount: vehicles.filter((vehicle) => vehicle.state === 'online').length,
    };
    checks.location = {
      ok: false,
      message: 'Location health is confirmed after a successful telemetry sync.',
    };
  } catch (error) {
    const message = error.message || 'Tesla diagnostics failed.';
    checks.token = {
      ok: !message.includes('refresh_token') && !message.includes('login_required') ? null : false,
      message,
    };
    checks.vehicles = { ok: false, message };
  }

  res.status(200).json(checks);
}
