const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const TESLA_AUTHORIZE_URL = process.env.TESLA_AUTHORIZE_URL || 'https://auth.tesla.com/oauth2/v3/authorize';
const TESLA_AUTH_URL = process.env.TESLA_AUTH_URL || 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const DEFAULT_REDIRECT_URI = process.env.TESLA_REDIRECT_URI || `http://127.0.0.1:${PORT}/api/tesla/callback`;
const DEFAULT_SCOPES = process.env.TESLA_SCOPES || 'openid offline_access user_data vehicle_device_data vehicle_location';
const ENV_PATH = path.join(__dirname, '.env');

let tokenCache = {
  accessToken: process.env.TESLA_ACCESS_TOKEN || '',
  refreshToken: process.env.TESLA_REFRESH_TOKEN || '',
  expiresAt: process.env.TESLA_ACCESS_TOKEN ? Date.now() + 10 * 60 * 1000 : 0,
};
const pendingAuthStates = new Set();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

function updateLocalEnv(updates) {
  const current = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const lines = current
    .split(/\r?\n/)
    .filter((line) => line.trim() && !Object.keys(updates).some((key) => line.startsWith(`${key}=`)));

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      lines.push(`${key}=${value}`);
    }
  });

  fs.writeFileSync(ENV_PATH, `${lines.join('\n')}\n`);
}

function hasRefreshConfig() {
  return Boolean(process.env.TESLA_CLIENT_ID && tokenCache.refreshToken);
}

async function refreshTeslaAccessToken() {
  if (!hasRefreshConfig()) {
    return tokenCache.accessToken;
  }

  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.TESLA_CLIENT_ID,
    refresh_token: tokenCache.refreshToken,
  });

  if (process.env.TESLA_CLIENT_SECRET) {
    form.set('client_secret', process.env.TESLA_CLIENT_SECRET);
  }

  const { data } = await axios.post(TESLA_AUTH_URL, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokenCache.refreshToken,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 90, 60) * 1000,
  };

  updateLocalEnv({
    TESLA_CLIENT_ID: process.env.TESLA_CLIENT_ID,
    TESLA_CLIENT_SECRET: process.env.TESLA_CLIENT_SECRET,
    TESLA_REFRESH_TOKEN: tokenCache.refreshToken,
  });

  return tokenCache.accessToken;
}

async function exchangeAuthorizationCode(code) {
  if (!process.env.TESLA_CLIENT_ID) {
    const error = new Error('TESLA_CLIENT_ID is required before starting Tesla OAuth');
    error.status = 400;
    throw error;
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.TESLA_CLIENT_ID,
    code,
    redirect_uri: DEFAULT_REDIRECT_URI,
  });

  if (process.env.TESLA_CLIENT_SECRET) {
    form.set('client_secret', process.env.TESLA_CLIENT_SECRET);
  }

  const { data } = await axios.post(TESLA_AUTH_URL, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokenCache.refreshToken,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 90, 60) * 1000,
  };

  updateLocalEnv({
    PORT,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
    TESLA_API_BASE: DEFAULT_FLEET_API_BASE,
    TESLA_AUTH_URL,
    TESLA_AUTHORIZE_URL,
    TESLA_REDIRECT_URI: DEFAULT_REDIRECT_URI,
    TESLA_SCOPES: DEFAULT_SCOPES,
    TESLA_CLIENT_ID: process.env.TESLA_CLIENT_ID,
    TESLA_CLIENT_SECRET: process.env.TESLA_CLIENT_SECRET,
    TESLA_REFRESH_TOKEN: tokenCache.refreshToken,
  });

  return tokenCache;
}

async function getTeslaAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  return refreshTeslaAccessToken();
}

async function teslaRequest(path, options = {}) {
  const accessToken = await getTeslaAccessToken();

  if (!accessToken) {
    const error = new Error('Tesla API credentials are not configured');
    error.status = 503;
    throw error;
  }

  const response = await axios({
    method: options.method || 'GET',
    baseURL: options.baseURL || DEFAULT_FLEET_API_BASE,
    url: path,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    params: options.params,
    data: options.data,
    timeout: 15000,
  });

  return response.data;
}

function normalizeVehicle(vehicle, telemetry = {}) {
  const chargeState = telemetry.charge_state || vehicle.charge_state || {};
  const driveState = telemetry.drive_state || vehicle.drive_state || {};
  const vehicleState = telemetry.vehicle_state || vehicle.vehicle_state || {};
  const vin = vehicle.vin || telemetry.vin;

  return {
    id: vehicle.id_s || vehicle.id || vin,
    vin,
    display_name: vehicle.display_name || vehicleState.vehicle_name || 'My Tesla',
    state: vehicle.state || telemetry.state || 'unknown',
    charge_state: chargeState,
    drive_state: driveState,
    vehicle_state: vehicleState,
    status: driveState.shift_state ? 'IN SERVICE' : vehicle.state === 'online' ? 'ONLINE' : vehicle.state || 'OFFLINE',
    battery: chargeState.battery_level,
    latitude: driveState.latitude,
    longitude: driveState.longitude,
    odometer: vehicleState.odometer,
    speed: driveState.speed,
    heading: driveState.heading,
    syncedAt: new Date().toISOString(),
  };
}

async function fetchVehicles() {
  const vehiclesPayload = await teslaRequest('/api/1/vehicles');
  const vehicles = vehiclesPayload.response || [];

  const enriched = await Promise.all(
    vehicles.map(async (vehicle) => {
      const vin = vehicle.vin || vehicle.id_s || vehicle.id;

      if (!vin || vehicle.state !== 'online') {
        return normalizeVehicle(vehicle);
      }

      try {
        const telemetryPayload = await teslaRequest(`/api/1/vehicles/${vin}/vehicle_data`);
        return normalizeVehicle(vehicle, telemetryPayload.response || {});
      } catch (error) {
        console.warn(`Tesla telemetry unavailable for ${vin}: ${error.response?.status || error.message}`);
        return normalizeVehicle(vehicle);
      }
    }),
  );

  return enriched;
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    teslaConfigured: Boolean(tokenCache.accessToken || hasRefreshConfig()),
    hasRefreshToken: hasRefreshConfig(),
  });
});

app.get('/api/tesla/auth-url', (req, res) => {
  if (!process.env.TESLA_CLIENT_ID) {
    res.status(400).json({
      error: 'TESLA_CLIENT_ID_MISSING',
      message: 'Add TESLA_CLIENT_ID to backend/.env, restart the backend, then retry.',
    });
    return;
  }

  const state = crypto.randomBytes(24).toString('hex');
  pendingAuthStates.add(state);

  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.TESLA_CLIENT_ID);
  url.searchParams.set('redirect_uri', DEFAULT_REDIRECT_URI);
  url.searchParams.set('scope', DEFAULT_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt_missing_scopes', 'true');

  res.json({
    url: url.toString(),
    redirectUri: DEFAULT_REDIRECT_URI,
    scopes: DEFAULT_SCOPES,
  });
});

app.get('/api/tesla/login', (req, res) => {
  if (!process.env.TESLA_CLIENT_ID) {
    res.status(400).send('Add TESLA_CLIENT_ID to backend/.env, restart the backend, then retry.');
    return;
  }

  const state = crypto.randomBytes(24).toString('hex');
  pendingAuthStates.add(state);

  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.TESLA_CLIENT_ID);
  url.searchParams.set('redirect_uri', DEFAULT_REDIRECT_URI);
  url.searchParams.set('scope', DEFAULT_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt_missing_scopes', 'true');

  res.redirect(url.toString());
});

app.get('/api/tesla/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`Tesla authorization failed: ${errorDescription || error}`);
    return;
  }

  if (!code || !state || !pendingAuthStates.has(state)) {
    res.status(400).send('Tesla authorization callback was missing a valid code/state pair.');
    return;
  }

  pendingAuthStates.delete(state);

  try {
    await exchangeAuthorizationCode(code);
    res.send(`
      <html>
        <body style="font-family: system-ui; background: #050816; color: white; padding: 32px;">
          <h1>Tesla connected</h1>
          <p>FleetOS saved your refresh token in backend/.env. You can close this tab and refresh the dashboard.</p>
        </body>
      </html>
    `);
  } catch (callbackError) {
    console.error('Tesla authorization code exchange failed:', callbackError.response?.data || callbackError.message);
    res.status(callbackError.status || callbackError.response?.status || 500).send(
      `Tesla token exchange failed: ${callbackError.response?.data?.error_description || callbackError.message}`,
    );
  }
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await fetchVehicles();
    res.json({ response: vehicles });
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error('Tesla API request failed:', error.response?.data || error.message);
    res.status(status).json({
      error: 'TESLA_API_UNAVAILABLE',
      message: error.message,
    });
  }
});

app.post('/api/vehicles/:vin/wake_up', async (req, res) => {
  try {
    const payload = await teslaRequest(`/api/1/vehicles/${req.params.vin}/wake_up`, {
      method: 'POST',
    });
    res.json(payload);
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error('Tesla wake request failed:', error.response?.data || error.message);
    res.status(status).json({
      error: 'TESLA_WAKE_UNAVAILABLE',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://127.0.0.1:${PORT}`);
  console.log(
    tokenCache.accessToken || hasRefreshConfig()
      ? 'Tesla Fleet API telemetry is configured'
      : 'Tesla Fleet API credentials are not configured; frontend will stay in simulation mode',
  );
});
