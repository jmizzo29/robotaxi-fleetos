const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env');
dotenv.config({ path: ENV_PATH });

const app = express();
const PORT = process.env.PORT || 3001;
const TESLA_AUTHORIZE_URL = process.env.TESLA_AUTHORIZE_URL || 'https://auth.tesla.com/oauth2/v3/authorize';
const TESLA_AUTH_URL = process.env.TESLA_AUTH_URL || 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const DEFAULT_REDIRECT_URI = process.env.TESLA_REDIRECT_URI || `http://localhost:${PORT}/callback`;
const DEFAULT_SCOPES = process.env.TESLA_SCOPES || 'openid offline_access user_data vehicle_device_data vehicle_location';
const TESLA_PARTNER_DOMAIN = process.env.TESLA_PARTNER_DOMAIN || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'xai' ? 'grok-4' : 'claude-sonnet-4-5');
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://robotaxi-fleetos.vercel.app',
];

let tokenCache = {
  accessToken: process.env.TESLA_ACCESS_TOKEN || '',
  refreshToken: process.env.TESLA_REFRESH_TOKEN || '',
  expiresAt: process.env.TESLA_ACCESS_TOKEN ? Date.now() + 10 * 60 * 1000 : 0,
};
const pendingAuthStates = new Map();

function getAllowedOrigins() {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...configured, ...DEFAULT_ALLOWED_ORIGINS])];
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
}));
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

function buildHeuristicFleetAnalysis(fleet = [], context = {}) {
  const vehicles = Array.isArray(fleet) ? fleet : [];
  const realVehicles = vehicles.filter((vehicle) => vehicle.isReal);
  const alerts = vehicles
    .flatMap((vehicle) => {
      const vehicleAlerts = [];
      const battery = Number(vehicle.battery);
      const anomalyRisk = Number(vehicle.anomalyRisk);
      const maintenanceScore = Number(vehicle.maintenanceScore);

      if (Number.isFinite(battery) && battery < 35) {
        vehicleAlerts.push({
          id: `battery-${vehicle.id}`,
          severity: battery < 20 ? 'CRITICAL' : 'WARNING',
          priorityScore: battery < 20 ? 94 : 78,
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Battery threshold risk',
          explanation: `${vehicle.name || vehicle.id} is at ${Math.round(battery)}% battery and may need charging capacity soon.`,
          recommendedAction: 'Route toward the nearest charging hub and reduce nonessential assignments.',
        });
      }

      if (Number.isFinite(anomalyRisk) && anomalyRisk > 20) {
        vehicleAlerts.push({
          id: `anomaly-${vehicle.id}`,
          severity: 'CRITICAL',
          priorityScore: Math.min(99, Math.round(72 + anomalyRisk)),
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Anomaly risk elevated',
          explanation: `${vehicle.name || vehicle.id} is above the anomaly threshold at ${Math.round(anomalyRisk)}%.`,
          recommendedAction: 'Pause aggressive dispatching and inspect telemetry trend before assigning long trips.',
        });
      }

      if (Number.isFinite(maintenanceScore) && maintenanceScore < 75) {
        vehicleAlerts.push({
          id: `maintenance-${vehicle.id}`,
          severity: 'WARNING',
          priorityScore: 70,
          vehicle: vehicle.name || vehicle.display_name || vehicle.id,
          title: 'Maintenance score degraded',
          explanation: `${vehicle.name || vehicle.id} has a maintenance score of ${Math.round(maintenanceScore)}%.`,
          recommendedAction: 'Schedule maintenance review during the next low-demand window.',
        });
      }

      return vehicleAlerts;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  const recommendations = [
    {
      id: 'sync-real-telemetry',
      title: realVehicles.length > 0 ? 'Prioritize real telemetry over simulation' : 'Sync Tesla telemetry',
      confidence: realVehicles.length > 0 ? 92 : 74,
      impact: 'Improves dispatch confidence by separating observed state from modeled state.',
      rationale: realVehicles.length > 0
        ? `${realVehicles.length} real Tesla vehicle${realVehicles.length === 1 ? '' : 's'} are feeding live state into FleetOS.`
        : 'No real Tesla vehicle is currently merged into the operating picture.',
      actionLabel: realVehicles.length > 0 ? 'Focus Real Tesla' : 'Sync Tesla',
      command: realVehicles.length > 0 ? 'Prioritize real Tesla telemetry in operator view' : 'Sync Tesla telemetry',
    },
    {
      id: 'balance-orlando',
      title: 'Protect Orlando demand coverage',
      confidence: 86,
      impact: 'Keeps the highest-profit corridor staffed while simulation continues.',
      rationale: 'Demand and profitability signals continue to favor the Orlando corridor.',
      actionLabel: 'Queue Rebalance',
      command: 'Rebalance Orlando corridor fleet capacity',
    },
    {
      id: 'charge-window',
      title: 'Stage charging during lower utilization',
      confidence: 81,
      impact: 'Reduces charging congestion and keeps high-battery vehicles available.',
      rationale: 'Battery and utilization distribution suggests charging should be staggered rather than clustered.',
      actionLabel: 'Optimize Charging',
      command: 'Charging Optimization Triggered',
    },
  ];

  return {
    provider: 'heuristic',
    model: 'local-rules',
    generatedAt: new Date().toISOString(),
    summary: context.summary || 'FleetOS generated a local AI-style operating assessment from current fleet telemetry.',
    alerts,
    recommendations,
  };
}

function buildFleetAnalysisPrompt(fleet = [], context = {}) {
  const compactFleet = fleet.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name || vehicle.display_name,
    isReal: Boolean(vehicle.isReal),
    status: vehicle.status || vehicle.state,
    battery: vehicle.battery,
    chargingState: vehicle.chargingState,
    speed: vehicle.speed,
    odometer: vehicle.odometer,
    anomalyRisk: vehicle.anomalyRisk,
    maintenanceScore: vehicle.maintenanceScore,
    profitability: vehicle.profitability,
    utilization: vehicle.utilization,
    assignment: vehicle.assignment,
    syncedAt: vehicle.syncedAt,
  }));

  return `Analyze this autonomous fleet operations snapshot for FleetOS.

Return only valid JSON with this exact shape:
{
  "summary": "one sentence operator summary",
  "alerts": [
    {
      "id": "stable-id",
      "severity": "INFO|WARNING|CRITICAL",
      "priorityScore": 0-100,
      "vehicle": "vehicle id or fleet",
      "title": "short title",
      "explanation": "why this matters",
      "recommendedAction": "operator action"
    }
  ],
  "recommendations": [
    {
      "id": "stable-id",
      "title": "short title",
      "confidence": 0-100,
      "impact": "business or operational impact",
      "rationale": "why this action is recommended",
      "actionLabel": "button label",
      "command": "command to enqueue"
    }
  ]
}

Prioritize real Tesla telemetry above simulation. Be concise and operational.

Context:
${JSON.stringify(context)}

Fleet:
${JSON.stringify(compactFleet)}`;
}

function parseAiJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function runAiFleetAnalysis(fleet = [], context = {}) {
  const fallback = buildHeuristicFleetAnalysis(fleet, context);
  const prompt = buildFleetAnalysisPrompt(fleet, context);

  if (AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const { data } = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: AI_MODEL,
        max_tokens: 1400,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const text = data.content?.map((part) => part.text || '').join('\n') || '';
    return {
      ...fallback,
      ...parseAiJson(text),
      provider: 'anthropic',
      model: AI_MODEL,
      generatedAt: new Date().toISOString(),
    };
  }

  if (AI_PROVIDER === 'xai' && process.env.XAI_API_KEY) {
    const { data } = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: AI_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are the FleetOS AI operations orchestrator. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          'content-type': 'application/json',
        },
        timeout: 30000,
      },
    );

    return {
      ...fallback,
      ...parseAiJson(data.choices?.[0]?.message?.content || ''),
      provider: 'xai',
      model: AI_MODEL,
      generatedAt: new Date().toISOString(),
    };
  }

  return fallback;
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

async function exchangeAuthorizationCode(code, redirectUri = DEFAULT_REDIRECT_URI) {
  if (!process.env.TESLA_CLIENT_ID) {
    const error = new Error('TESLA_CLIENT_ID is required before starting Tesla OAuth');
    error.status = 400;
    throw error;
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.TESLA_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
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
    TESLA_REDIRECT_URI: redirectUri,
    TESLA_SCOPES: DEFAULT_SCOPES,
    TESLA_CLIENT_ID: process.env.TESLA_CLIENT_ID,
    TESLA_CLIENT_SECRET: process.env.TESLA_CLIENT_SECRET,
    TESLA_REFRESH_TOKEN: tokenCache.refreshToken,
  });

  return tokenCache;
}

function buildTeslaAuthorizeUrl(redirectUri = DEFAULT_REDIRECT_URI) {
  const state = crypto.randomBytes(24).toString('hex');
  pendingAuthStates.set(state, redirectUri);

  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.TESLA_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', DEFAULT_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt_missing_scopes', 'true');

  return { state, redirectUri, url };
}

function getRedirectUriFromRequest(req) {
  if (req.query.redirect_uri) {
    return String(req.query.redirect_uri);
  }

  if (req.query.path) {
    const callbackPath = String(req.query.path).startsWith('/') ? String(req.query.path) : `/${req.query.path}`;
    return `http://localhost:${PORT}${callbackPath}`;
  }

  if (req.query.host === 'localhost') {
    return DEFAULT_REDIRECT_URI;
  }

  if (req.query.host === '127') {
    return `http://127.0.0.1:${PORT}/api/tesla/callback`;
  }

  return DEFAULT_REDIRECT_URI;
}

async function getTeslaAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  return refreshTeslaAccessToken();
}

async function getTeslaPartnerToken(audience = DEFAULT_FLEET_API_BASE) {
  if (!process.env.TESLA_CLIENT_ID || !process.env.TESLA_CLIENT_SECRET) {
    const error = new Error('TESLA_CLIENT_ID and TESLA_CLIENT_SECRET are required for partner registration');
    error.status = 400;
    throw error;
  }

  const form = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.TESLA_CLIENT_ID,
    client_secret: process.env.TESLA_CLIENT_SECRET,
    audience,
    scope: process.env.TESLA_PARTNER_SCOPES || 'openid vehicle_device_data vehicle_cmds vehicle_charging_cmds',
  });

  const { data } = await axios.post(TESLA_AUTH_URL, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data.access_token;
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
  const locationData = telemetry.location_data || vehicle.location_data || {};
  const vehicleState = telemetry.vehicle_state || vehicle.vehicle_state || {};
  const vin = vehicle.vin || telemetry.vin;
  const state = vehicle.state || telemetry.state || 'unknown';
  const status = driveState.shift_state
    ? 'DRIVING'
    : state === 'online'
      ? 'PARKED'
      : state;

  return {
    id: vehicle.id_s || vehicle.id || vin,
    vin,
    display_name: vehicle.display_name || vehicleState.vehicle_name || 'My Tesla',
    state,
    charge_state: chargeState,
    drive_state: {
      ...driveState,
      latitude: driveState.latitude ?? locationData.latitude,
      longitude: driveState.longitude ?? locationData.longitude,
      heading: driveState.heading ?? locationData.heading,
      gps_as_of: driveState.gps_as_of ?? locationData.gps_as_of,
    },
    location_data: locationData,
    vehicle_state: vehicleState,
    status,
    battery: chargeState.battery_level,
    latitude: driveState.latitude ?? locationData.latitude,
    longitude: driveState.longitude ?? locationData.longitude,
    chargingState: chargeState.charging_state,
    softwareVersion: vehicleState.car_version,
    locked: vehicleState.locked,
    serviceMode: vehicleState.service_mode,
    odometer: vehicleState.odometer,
    speed: driveState.speed,
    heading: driveState.heading ?? locationData.heading,
    gpsAsOf: driveState.gps_as_of ?? locationData.gps_as_of,
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
        const telemetryPayload = await teslaRequest(`/api/1/vehicles/${vin}/vehicle_data`, {
          params: {
            endpoints: 'charge_state;drive_state;location_data;vehicle_state',
          },
        });
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
    redirectUri: DEFAULT_REDIRECT_URI,
    partnerDomain: TESLA_PARTNER_DOMAIN || null,
    alternateRedirectUris: [
      `http://localhost:${PORT}/callback`,
      `http://localhost:${PORT}/api/tesla/callback`,
      `http://localhost:${PORT}/auth/callback`,
    ],
  });
});

app.get('/api/tesla/diagnostics', async (req, res) => {
  const checks = {
    oauthRefreshToken: Boolean(tokenCache.refreshToken),
    clientSecret: Boolean(process.env.TESLA_CLIENT_SECRET),
    partnerDomain: TESLA_PARTNER_DOMAIN || null,
    fleetApiBase: DEFAULT_FLEET_API_BASE,
    publicKeyUrl: TESLA_PARTNER_DOMAIN
      ? `https://${TESLA_PARTNER_DOMAIN}/.well-known/appspecific/com.tesla.3p.public-key.pem`
      : null,
    vehicles: null,
    partnerPublicKey: null,
  };

  try {
    const payload = await teslaRequest('/api/1/vehicles');
    checks.vehicles = {
      ok: true,
      count: payload.response?.length || 0,
    };
  } catch (error) {
    checks.vehicles = {
      ok: false,
      status: error.status || error.response?.status || null,
      message: error.response?.data?.error || error.message,
    };
  }

  if (TESLA_PARTNER_DOMAIN) {
    try {
      const partnerToken = await getTeslaPartnerToken();
      const { data } = await axios.get(`${DEFAULT_FLEET_API_BASE}/api/1/partner_accounts/public_key`, {
        headers: { Authorization: `Bearer ${partnerToken}` },
        params: { domain: TESLA_PARTNER_DOMAIN },
        timeout: 15000,
      });
      checks.partnerPublicKey = {
        ok: true,
        response: data,
      };
    } catch (error) {
      checks.partnerPublicKey = {
        ok: false,
        status: error.response?.status || null,
        message: error.response?.data?.error || error.message,
      };
    }
  }

  res.json(checks);
});

app.post('/api/tesla/register-partner', async (req, res) => {
  const domain = req.body?.domain || TESLA_PARTNER_DOMAIN;
  const fleetApiBase = req.body?.fleetApiBase || DEFAULT_FLEET_API_BASE;

  if (!domain) {
    res.status(400).json({
      error: 'TESLA_PARTNER_DOMAIN_MISSING',
      message: 'Set TESLA_PARTNER_DOMAIN to your deployed HTTPS app domain, without https://.',
    });
    return;
  }

  try {
    const publicKeyUrl = `https://${domain}/.well-known/appspecific/com.tesla.3p.public-key.pem`;
    await axios.get(publicKeyUrl, { timeout: 15000 });
    const partnerToken = await getTeslaPartnerToken(fleetApiBase);
    const { data } = await axios.post(
      `${fleetApiBase}/api/1/partner_accounts`,
      { domain },
      {
        headers: { Authorization: `Bearer ${partnerToken}` },
        timeout: 15000,
      },
    );

    updateLocalEnv({
      TESLA_PARTNER_DOMAIN: domain,
      TESLA_API_BASE: fleetApiBase,
    });

    res.json({
      ok: true,
      domain,
      fleetApiBase,
      publicKeyUrl,
      response: data,
    });
  } catch (error) {
    res.status(error.response?.status || error.status || 500).json({
      error: 'TESLA_PARTNER_REGISTER_FAILED',
      message: error.response?.data?.error || error.message,
      response: error.response?.data,
    });
  }
});

app.get('/api/tesla/auth-url', (req, res) => {
  if (!process.env.TESLA_CLIENT_ID) {
    res.status(400).json({
      error: 'TESLA_CLIENT_ID_MISSING',
      message: 'Add TESLA_CLIENT_ID to backend/.env, restart the backend, then retry.',
    });
    return;
  }

  const redirectUri = getRedirectUriFromRequest(req);
  const { url } = buildTeslaAuthorizeUrl(redirectUri);

  res.json({
    url: url.toString(),
    redirectUri,
    scopes: DEFAULT_SCOPES,
  });
});

app.get('/api/tesla/login', (req, res) => {
  if (!process.env.TESLA_CLIENT_ID) {
    res.status(400).send('Add TESLA_CLIENT_ID to backend/.env, restart the backend, then retry.');
    return;
  }

  const redirectUri = getRedirectUriFromRequest(req);
  const { url } = buildTeslaAuthorizeUrl(redirectUri);

  res.redirect(url.toString());
});

app.get('/api/tesla/login-localhost', (req, res) => {
  res.redirect('/api/tesla/login?host=localhost');
});

async function handleTeslaCallback(req, res) {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`Tesla authorization failed: ${errorDescription || error}`);
    return;
  }

  if (!code || !state || !pendingAuthStates.has(state)) {
    res.status(400).send('Tesla authorization callback was missing a valid code/state pair.');
    return;
  }

  const redirectUri = pendingAuthStates.get(state);
  pendingAuthStates.delete(state);

  try {
    await exchangeAuthorizationCode(code, redirectUri);
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
}

app.get('/callback', handleTeslaCallback);
app.get('/auth/callback', handleTeslaCallback);
app.get('/api/tesla/callback', handleTeslaCallback);

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await fetchVehicles();
    res.json({ response: vehicles });
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error('Tesla API request failed:', error.response?.data || error.message);
    res.status(status).json({
      error: 'TESLA_API_UNAVAILABLE',
      message: error.response?.data?.error || error.message,
      response: error.response?.data,
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

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const analysis = await runAiFleetAnalysis(req.body?.fleet || [], req.body?.context || {});
    res.json(analysis);
  } catch (error) {
    console.error('AI fleet analysis failed:', error.response?.data || error.message);
    res.status(500).json({
      ...buildHeuristicFleetAnalysis(req.body?.fleet || [], req.body?.context || {}),
      error: 'AI_ANALYSIS_FAILED',
      message: error.response?.data?.error?.message || error.message,
    });
  }
});

const memoryEvents = [];
const assetRecords = {};
const earlyAccessLeads = [];
const revenueRecords = [];
const MAX_MEMORY_EVENTS = 120;

function normalizeMemoryEvent(event = {}) {
  return {
    id: event.id || `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || 'Event',
    title: event.title || 'FleetOS event',
    detail: event.detail || '',
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || 'FleetOS',
    status: event.status || 'recorded',
    ragReady: Boolean(event.ragReady),
    metadata: event.metadata || {},
  };
}

app.get('/api/memory', (req, res) => {
  res.json({ events: memoryEvents });
});

app.post('/api/memory', (req, res) => {
  const incoming = Array.isArray(req.body?.events)
    ? req.body.events
    : req.body?.event
      ? [req.body.event]
      : [];

  memoryEvents.unshift(...incoming.map(normalizeMemoryEvent));
  memoryEvents.splice(MAX_MEMORY_EVENTS);
  res.json({ events: memoryEvents });
});

app.delete('/api/memory', (req, res) => {
  memoryEvents.splice(0);
  res.json({ events: [] });
});

app.get('/api/assets', (req, res) => {
  res.json({ records: assetRecords });
});

app.post('/api/assets', (req, res) => {
  const { key, record } = req.body || {};

  if (!key || !record) {
    res.status(400).json({ error: 'ASSET_RECORD_MISSING' });
    return;
  }

  assetRecords[key] = record;
  res.json({ records: assetRecords });
});

app.delete('/api/assets', (req, res) => {
  if (req.query?.key) {
    delete assetRecords[req.query.key];
  } else {
    Object.keys(assetRecords).forEach((key) => delete assetRecords[key]);
  }

  res.json({ records: assetRecords });
});

app.get('/api/leads', (req, res) => {
  res.json({
    count: earlyAccessLeads.length,
    leads: earlyAccessLeads.slice(0, 25),
  });
});

app.post('/api/leads', (req, res) => {
  const lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(req.body?.name || '').trim(),
    email: String(req.body?.email || '').trim().toLowerCase(),
    teslaCount: String(req.body?.teslaCount || '1').trim(),
    useCase: String(req.body?.useCase || 'Owner rental').trim(),
    plan: String(req.body?.plan || 'First Tesla free').trim(),
    createdAt: new Date().toISOString(),
  };

  if (!lead.email || !lead.email.includes('@')) {
    res.status(400).json({
      error: 'EMAIL_REQUIRED',
      message: 'Enter a valid email address.',
    });
    return;
  }

  earlyAccessLeads.unshift(lead);
  earlyAccessLeads.splice(100);
  console.log('FleetOS early access lead', {
    email: lead.email,
    teslaCount: lead.teslaCount,
    useCase: lead.useCase,
    plan: lead.plan,
  });

  res.status(201).json({ ok: true, lead });
});

app.get('/api/revenue', (req, res) => {
  res.json({ records: revenueRecords });
});

app.post('/api/revenue', (req, res) => {
  const incoming = Array.isArray(req.body?.records)
    ? req.body.records
    : req.body?.record
      ? [req.body.record]
      : [];

  const normalized = incoming.map((record) => ({
    id: record.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleKey: String(record.vehicleKey || record.vin || record.vehicle || ''),
    vehicleLabel: String(record.vehicleLabel || record.vehicle || ''),
    date: record.date || new Date().toISOString().slice(0, 10),
    source: record.source || 'Manual',
    amount: Number(record.amount) || 0,
    notes: record.notes || '',
    createdAt: record.createdAt || new Date().toISOString(),
  }));

  revenueRecords.unshift(...normalized);
  revenueRecords.splice(1000);
  res.status(201).json({ records: revenueRecords });
});

app.delete('/api/revenue', (req, res) => {
  revenueRecords.splice(0);
  res.json({ records: [] });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(
    tokenCache.accessToken || hasRefreshConfig()
      ? 'Tesla Fleet API telemetry is configured'
      : 'Tesla Fleet API credentials are not configured; frontend will stay in simulation mode',
  );
});
