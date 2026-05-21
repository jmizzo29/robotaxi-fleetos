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

  const tokenUrl = new URL(TESLA_AUTH_URL);
  tokenUrl.searchParams.set('redirect_uri', TESLA_REDIRECT_URI);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Tesla token refresh failed: ${detail || response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function teslaRequest(path, accessToken, options = {}) {
  const response = await fetch(`${DEFAULT_FLEET_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Tesla API request failed: ${detail || response.status}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasTeslaConfig()) {
    res.status(503).json({
      error: 'TESLA_CONFIG_MISSING',
      message: 'Tesla Fleet API env vars are not configured in Vercel.',
    });
    return;
  }

  const vin = req.query?.vin;

  if (!vin) {
    res.status(400).json({
      error: 'TESLA_VEHICLE_MISSING',
      message: 'A Tesla VIN or vehicle id is required.',
    });
    return;
  }

  try {
    const accessToken = await refreshTeslaAccessToken();
    const payload = await teslaRequest(`/api/1/vehicles/${encodeURIComponent(vin)}/wake_up`, accessToken, {
      method: 'POST',
    });

    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: 'TESLA_WAKE_UNAVAILABLE',
      message: error.message,
    });
  }
}
