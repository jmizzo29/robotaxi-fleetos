const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ENV_PATH = path.join(__dirname, '.env');
dotenv.config({ path: ENV_PATH });

const app = express();
const PORT = process.env.PORT || 3001;
const TESLA_AUTHORIZE_URL = process.env.TESLA_AUTHORIZE_URL || 'https://auth.tesla.com/oauth2/v3/authorize';
const TESLA_AUTH_URL = process.env.TESLA_AUTH_URL || 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const DEFAULT_REDIRECT_URI = process.env.TESLA_REDIRECT_URI || `http://localhost:${PORT}/callback`;
const DEFAULT_SCOPES = process.env.TESLA_SCOPES || 'openid offline_access user_data vehicle_device_data vehicle_location vehicle_charging_cmds';
const TESLA_PARTNER_DOMAIN = process.env.TESLA_PARTNER_DOMAIN || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'xai' ? 'grok-4' : 'claude-sonnet-4-5');
const { calculateDynamicPrice } = require('./src/services/pricingEngine');
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
  'https://www.autofleeto.com',
  'https://autofleeto.com',
];
const pgPool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,   // or true if you have proper certs
    },
  })
  : null;
let fleetSchemaReady;

let tokenCache = {
  accessToken: process.env.TESLA_ACCESS_TOKEN || '',
  refreshToken: process.env.TESLA_REFRESH_TOKEN || '',
  expiresAt: process.env.TESLA_ACCESS_TOKEN ? Date.now() + 10 * 60 * 1000 : 0,
};
const pendingAuthStates = new Map();

function isPrivateLanHostname(hostname = '') {
  const host = String(hostname).toLowerCase();
  return /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)
    || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);
}

function isDevBrowserOrigin(origin = '') {
  try {
    const { hostname, port } = new URL(origin);
    const devPort = ['5173', '5174', '5175', '5176', '5177', String(PORT)].includes(port);
    return devPort && (isLocalHostname(hostname) || isPrivateLanHostname(hostname));
  } catch {
    return false;
  }
}

function getAllowedOrigins() {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...configured, ...DEFAULT_ALLOWED_ORIGINS])];
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().includes(origin) || isDevBrowserOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

async function handleServerlessRoute(modulePath, req, res) {
  const routeUrl = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
  req.query = Object.fromEntries(routeUrl.searchParams.entries());
  const handlerModule = await import(`../${modulePath}`);
  return handlerModule.default(req, res);
}

app.post('/api/auth/register', (req, res) => handleServerlessRoute('api/auth/register.js', req, res));
app.post('/api/auth/login', (req, res) => handleServerlessRoute('api/auth/login.js', req, res));
app.get('/api/auth/session', (req, res) => handleServerlessRoute('api/auth/session.js', req, res));
app.post('/api/auth/logout', (req, res) => handleServerlessRoute('api/auth/logout.js', req, res));
app.get('/api/auth/profile', (req, res) => handleServerlessRoute('api/auth/profile.js', req, res));
app.patch('/api/auth/profile', (req, res) => handleServerlessRoute('api/auth/profile.js', req, res));
app.post('/api/auth/magic/request', (req, res) => handleServerlessRoute('api/auth/magic/request.js', req, res));
app.get('/api/auth/magic/verify', (req, res) => handleServerlessRoute('api/auth/magic/verify.js', req, res));
app.get('/api/billing/status', (req, res) => handleServerlessRoute('api/billing/status.js', req, res));
app.post('/api/owner-context', (req, res) => handleServerlessRoute('api/owner-context.js', req, res));
app.post('/api/ai/analyze', (req, res) => handleServerlessRoute('api/ai/analyze.js', req, res));
app.post('/api/agent/ask', (req, res) => handleServerlessRoute('api/agent/ask.js', req, res));
app.get('/api/social/x-updates', (req, res) => handleServerlessRoute('api/social/x-updates.js', req, res));
app.post('/api/admin/purge-user', (req, res) => handleServerlessRoute('api/admin/purge-user.js', req, res));
app.get('/api/owner-alerts/prefs', (req, res) => handleServerlessRoute('api/owner-alerts/prefs.js', req, res));
app.patch('/api/owner-alerts/prefs', (req, res) => handleServerlessRoute('api/owner-alerts/prefs.js', req, res));
app.post('/api/owner-alerts/subscribe', (req, res) => handleServerlessRoute('api/owner-alerts/subscribe.js', req, res));
app.delete('/api/owner-alerts/subscribe', (req, res) => handleServerlessRoute('api/owner-alerts/subscribe.js', req, res));
app.get('/api/owner-alerts/active', (req, res) => handleServerlessRoute('api/owner-alerts/active.js', req, res));
app.post('/api/owner-alerts/dismiss', (req, res) => handleServerlessRoute('api/owner-alerts/dismiss.js', req, res));
app.get('/api/cron/owner-alerts', (req, res) => handleServerlessRoute('api/cron/owner-alerts.js', req, res));
app.post('/api/cron/owner-alerts', (req, res) => handleServerlessRoute('api/cron/owner-alerts.js', req, res));

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

function scheduleLocalEnvUpdate(updates) {
  setImmediate(() => {
    try {
      updateLocalEnv(updates);
    } catch (error) {
      console.warn('[Tesla OAuth] Failed to persist token env:', error.message);
    }
  });
}

function hasRefreshConfig() {
  return Boolean(process.env.TESLA_CLIENT_ID && tokenCache.refreshToken);
}

function requirePostgres(res, label = 'ROBOAGENT data') {
  if (pgPool) return true;
  res.status(503).json({
    error: 'DATABASE_REQUIRED',
    message: `Postgres DATABASE_URL is required for ${label}.`,
  });
  return false;
}

async function ensureFleetSchema() {
  if (!pgPool) return false;
  if (fleetSchemaReady) return fleetSchemaReady;
  const schemaPath = path.join(__dirname, '..', 'docs', 'fleetos-postgres-schema.sql');
  fleetSchemaReady = pgPool.query(fs.readFileSync(schemaPath, 'utf8')).then(() => true);
  return fleetSchemaReady;
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
        ? `${realVehicles.length} real Tesla vehicle${realVehicles.length === 1 ? '' : 's'} are feeding live state into ROBOAGENT.`
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
    {
      id: 'event-surge-pricing',
      title: 'Event-Specific Surge Pricing',
      confidence: 82,
      impact: 'Applies intelligent price caps per event type (concerts/festivals capped lower, sports higher) while using PredictHQ demand signals.',
      rationale: 'Prevents over-surging on big events while still capturing upside. Uses calculateDynamicPrice with event-aware caps.',
      actionLabel: 'Calculate Surges',
      command: 'Run dynamic pricing with event caps for next 5 days',
    },
  ];

  return {
    provider: 'heuristic',
    model: 'local-rules',
    generatedAt: new Date().toISOString(),
    summary: context.summary || 'ROBOAGENT generated a local AI-style operating assessment from current fleet telemetry.',
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

  return `Analyze this autonomous fleet operations snapshot for ROBOAGENT.

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
          { role: 'system', content: 'You are the ROBOAGENT AI operations orchestrator. Return only valid JSON.' },
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
    timeout: 15000,
  });

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokenCache.refreshToken,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 90, 60) * 1000,
  };

  scheduleLocalEnvUpdate({
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
    timeout: 15000,
  });

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokenCache.refreshToken,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 90, 60) * 1000,
  };

  scheduleLocalEnvUpdate({
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

  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.TESLA_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', DEFAULT_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt_missing_scopes', 'true');

  return { state, redirectUri, url };
}

function isLocalHostname(value = '') {
  return /localhost|127\.0\.0\.1/.test(String(value));
}

function parseTrustedClientOrigin(value = '') {
  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (isLocalHostname(url.hostname) || isPrivateLanHostname(url.hostname)) {
      return url.origin;
    }
  } catch {
    return null;
  }
  return null;
}

function refererOriginFromRequest(req) {
  const referer = req.headers.referer || req.headers.referrer;
  if (!referer) return null;
  try {
    return new URL(String(referer)).origin;
  } catch {
    return null;
  }
}

function getCallbackPathFromConfigured(configured = process.env.TESLA_REDIRECT_URI || '') {
  try {
    const pathname = new URL(configured).pathname;
    if (pathname && pathname !== '/') return pathname;
  } catch {
    // fall through to default callback path
  }
  return '/api/tesla/callback';
}

// Resolve the origin the user's browser actually reached us on. When the Vite
// dev server proxies /api with xfwd enabled, x-forwarded-host carries the real
// front-end host (e.g. a phone hitting http://192.168.1.50:5173), which we need
// so the OAuth redirect lands on a host the phone can actually reach.
function originFromRequest(req) {
  if (process.env.APP_PUBLIC_ORIGIN) {
    return process.env.APP_PUBLIC_ORIGIN.replace(/\/$/, '');
  }

  const clientOrigin = parseTrustedClientOrigin(req.query.clientOrigin);
  if (clientOrigin) return clientOrigin;

  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    const forwardedProto = req.headers['x-forwarded-proto'] || 'http';
    return `${forwardedProto}://${forwardedHost}`;
  }

  const refererOrigin = refererOriginFromRequest(req);
  if (refererOrigin && isDevBrowserOrigin(refererOrigin)) {
    return refererOrigin;
  }

  const host = req.get('host') || `localhost:${PORT}`;
  const proto = isLocalHostname(host) ? 'http' : (req.protocol || 'http');
  return `${proto}://${host}`;
}

function buildDerivedRedirectUri(origin) {
  const callbackPath = getCallbackPathFromConfigured();
  return `${origin.replace(/\/$/, '')}${callbackPath}`;
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
    return `http://127.0.0.1:${PORT}${getCallbackPathFromConfigured()}`;
  }

  // A configured TESLA_REDIRECT_URI wins, EXCEPT when it points at localhost
  // while the browser reached us on a non-local host (a phone/tablet on the LAN
  // or a tunnel). In that case localhost would be unreachable from the device,
  // so we derive the callback from the origin the browser actually used. Vite
  // proxies both /api/tesla/callback and /callback back to this server.
  const origin = originFromRequest(req);
  const configured = process.env.TESLA_REDIRECT_URI || '';
  const configuredIsLocal = isLocalHostname(configured);
  const originIsLocal = isLocalHostname(origin);

  if (configured && !(configuredIsLocal && !originIsLocal)) {
    return configured;
  }

  return buildDerivedRedirectUri(origin);
}

function getMobileRedirectSetupHint(redirectUri, origin) {
  if (process.env.APP_PUBLIC_ORIGIN) return null;

  let hostname = '';
  try {
    hostname = new URL(redirectUri).hostname;
  } catch {
    return null;
  }

  if (!isPrivateLanHostname(hostname)) return null;

  return {
    redirectUri,
    origin,
    message: 'Mobile/LAN Tesla OAuth needs the exact redirect URI registered in your Tesla developer app, or an HTTPS tunnel via APP_PUBLIC_ORIGIN.',
  };
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

  await saveVehicleTelemetry(enriched);
  return enriched;
}

async function saveVehicleTelemetry(vehicles) {
  if (!pgPool) return;
  await ensureFleetSchema();

  await Promise.all(vehicles.map(async (vehicle) => {
    const vehicleId = String(vehicle.id || vehicle.vin || `vehicle-${Date.now()}`);
    await pgPool.query(
      `insert into fleetos_vehicles (
        id, vin, tesla_vehicle_id, display_name, state, status, battery_level,
        latitude, longitude, heading, speed, odometer, charging_state,
        software_version, locked, service_mode, raw, last_synced_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now())
      on conflict (id) do update set
        vin = excluded.vin,
        tesla_vehicle_id = excluded.tesla_vehicle_id,
        display_name = excluded.display_name,
        state = excluded.state,
        status = excluded.status,
        battery_level = excluded.battery_level,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        heading = excluded.heading,
        speed = excluded.speed,
        odometer = excluded.odometer,
        charging_state = excluded.charging_state,
        software_version = excluded.software_version,
        locked = excluded.locked,
        service_mode = excluded.service_mode,
        raw = excluded.raw,
        last_synced_at = excluded.last_synced_at,
        updated_at = now()`,
      [
        vehicleId,
        vehicle.vin || null,
        String(vehicle.id || '') || null,
        vehicle.display_name || null,
        vehicle.state || null,
        vehicle.status || null,
        vehicle.battery ?? null,
        vehicle.latitude ?? null,
        vehicle.longitude ?? null,
        vehicle.heading ?? null,
        vehicle.speed ?? null,
        vehicle.odometer ?? null,
        vehicle.chargingState || null,
        vehicle.softwareVersion || null,
        vehicle.locked ?? null,
        vehicle.serviceMode ?? null,
        JSON.stringify(vehicle),
        vehicle.syncedAt || new Date().toISOString(),
      ],
    );

    await pgPool.query(
      `insert into fleetos_telemetry_snapshots (
        vehicle_id, vin, captured_at, state, status, battery_level, latitude, longitude,
        heading, speed, odometer, charging_state, software_version, locked, service_mode, raw
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        vehicleId,
        vehicle.vin || null,
        vehicle.syncedAt || new Date().toISOString(),
        vehicle.state || null,
        vehicle.status || null,
        vehicle.battery ?? null,
        vehicle.latitude ?? null,
        vehicle.longitude ?? null,
        vehicle.heading ?? null,
        vehicle.speed ?? null,
        vehicle.odometer ?? null,
        vehicle.chargingState || null,
        vehicle.softwareVersion || null,
        vehicle.locked ?? null,
        vehicle.serviceMode ?? null,
        JSON.stringify(vehicle),
      ],
    );
  }));
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

  const origin = originFromRequest(req);
  const redirectUri = getRedirectUriFromRequest(req);
  const { url } = buildTeslaAuthorizeUrl(redirectUri);

  res.json({
    url: url.toString(),
    redirectUri,
    origin,
    callbackPath: getCallbackPathFromConfigured(),
    mobileSetupRequired: Boolean(getMobileRedirectSetupHint(redirectUri, origin)),
    scopes: DEFAULT_SCOPES,
  });
});

app.get('/api/tesla/login', (req, res) => {
  if (!process.env.TESLA_CLIENT_ID) {
    res.status(400).send('Add TESLA_CLIENT_ID to backend/.env, restart the backend, then retry.');
    return;
  }

  const origin = originFromRequest(req);
  const redirectUri = getRedirectUriFromRequest(req);
  const returnTo = req.query.returnTo || `${origin}/#/overview`;
  const mobileHint = getMobileRedirectSetupHint(redirectUri, origin);

  if (mobileHint) {
    console.warn(
      '[Tesla OAuth] Mobile/LAN redirect URI must be registered in Tesla portal (or use APP_PUBLIC_ORIGIN HTTPS tunnel):',
      redirectUri,
    );
  }

  const { state, url } = buildTeslaAuthorizeUrl(redirectUri);

  // Store both the Tesla callback redirectUri and the desired frontend returnTo
  pendingAuthStates.set(state, { redirectUri, returnTo });

  console.log('[Tesla OAuth] Starting login. redirect_uri:', redirectUri, 'returnTo:', returnTo);

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

  // Support both new object storage { redirectUri, returnTo } and legacy string storage
  const storedValue = pendingAuthStates.get(state);
  pendingAuthStates.delete(state);

  let redirectUri;
  let returnTo = '/#/overview';

  if (storedValue) {
    if (typeof storedValue === 'object' && storedValue !== null) {
      redirectUri = storedValue.redirectUri;
      returnTo = storedValue.returnTo || returnTo;
    } else {
      // legacy storage was just the redirectUri string
      redirectUri = storedValue;
    }
  }

  // Make sure returnTo is a usable URL (convert relative hash to full origin if needed)
  if (returnTo && !/^https?:\/\//i.test(returnTo)) {
    // Fallback: build a best-effort full URL using the origin the browser reached
    // us on (honours x-forwarded-host so a phone lands back on the LAN/tunnel host).
    const origin = originFromRequest(req);
    returnTo = `${origin}${returnTo.startsWith('/') ? '' : '/'}${returnTo}`;
  }

  try {
    await exchangeAuthorizationCode(code, redirectUri);

    console.log('[Tesla OAuth] Success. Redirecting browser back to SPA:', returnTo);

    // Automatically redirect the browser straight back into the React app (SPA).
    // This gives the seamless "back into the app" experience instead of a static success page.
    res.redirect(returnTo);
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
  if (!requirePostgres(res, 'Tesla telemetry sync')) return;
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

const MISSING_CHARGING_SCOPE_MESSAGE = 'Charging history needs Tesla charging permission. Connect Tesla again to grant it. The app is not broken.';

function teslaErrorLooksLikeMissingChargingScope(error) {
  const detail = error.response?.data || {};
  const text = `${error.message || ''} ${JSON.stringify(detail)}`.toLowerCase();
  return (
    text.includes('vehicle_charging_cmds')
    || text.includes('missing scope')
    || text.includes('missing_scopes')
    || text.includes('insufficient_scope')
    || ((error.status || error.response?.status) === 403 && text.includes('scope'))
  );
}

function extractChargeHistoryRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  return [];
}

app.get('/api/vehicles/:vin/charging/history', async (req, res) => {
  try {
    const startTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const payload = await teslaRequest('/api/1/dx/charging/history', {
      params: {
        vin: req.params.vin,
        startTime,
        pageNo: 1,
        pageSize: 12,
      },
    });
    const sessions = extractChargeHistoryRows(payload).map((session) => ({
      id: session.sessionId || session.chargeSessionId || session.id,
      vin: session.vin || req.params.vin,
      startedAt: session.chargeStartDateTime || session.startDateTime || session.startedAt || null,
      endedAt: session.chargeStopDateTime || session.endDateTime || session.endedAt || null,
      energyKwh: session.energyAdded ?? session.energy_added ?? session.kwh ?? null,
      billedAmount: session.feeTotal ?? session.cost ?? session.billedAmount ?? null,
      currency: session.currencyCode || 'USD',
      locationName: session.siteLocationName || session.chargingSiteName || session.locationName || null,
      latitude: session.chargingLocation?.latitude ?? session.latitude ?? null,
      longitude: session.chargingLocation?.longitude ?? session.longitude ?? null,
    }));
    res.json({ sessions, hasChargingCmds: true });
  } catch (error) {
    const status = teslaErrorLooksLikeMissingChargingScope(error) ? 403 : (error.status || error.response?.status || 502);
    res.status(status).json({
      error: status === 403 ? 'MISSING_CHARGING_SCOPE' : 'TESLA_CHARGE_HISTORY_UNAVAILABLE',
      message: status === 403 ? MISSING_CHARGING_SCOPE_MESSAGE : (error.message || 'Charge history unavailable'),
      hasChargingCmds: status === 403 ? false : undefined,
    });
  }
});

app.post('/api/vehicles/:vin/charging/command', async (req, res) => {
  const action = String(req.body?.action || '').trim().toLowerCase();
  const commands = {
    start: 'charge_start',
    stop: 'charge_stop',
    set_limit: 'set_charge_limit',
  };
  const path = commands[action];
  if (!path) {
    res.status(400).json({ error: 'TESLA_CHARGE_COMMAND_INVALID', message: 'Use start, stop, or set_limit.' });
    return;
  }
  try {
    const payload = await teslaRequest(`/api/1/vehicles/${req.params.vin}/command/${path}`, {
      method: 'POST',
      data: action === 'set_limit' ? { percent: Number(req.body?.percent) } : undefined,
    });
    res.json(payload);
  } catch (error) {
    const status = teslaErrorLooksLikeMissingChargingScope(error) ? 403 : (error.status || error.response?.status || 502);
    res.status(status).json({
      error: status === 403 ? 'MISSING_CHARGING_SCOPE' : 'TESLA_CHARGE_COMMAND_UNAVAILABLE',
      message: status === 403 ? MISSING_CHARGING_SCOPE_MESSAGE : (error.message || 'Charging command unavailable'),
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

const MAX_MEMORY_EVENTS = 120;

async function ensureFeedbackTable() {
  if (!pgPool) return;
  await pgPool.query(`
    create table if not exists beta_feedback (
      id text primary key,
      type text not null default 'feedback',
      rating integer,
      title text not null,
      detail text not null,
      route text,
      email text,
      created_at timestamptz not null default now()
    )
  `);
}

async function ensureLeadTable() {
  if (!pgPool) return;
  await pgPool.query(`
    create table if not exists beta_leads (
      id text primary key,
      name text,
      email text not null,
      tesla_count text,
      use_case text,
      plan text,
      created_at timestamptz not null default now()
    )
  `);
}

async function ensureRevenueTable() {
  if (!pgPool) return;
  await ensureFleetSchema();
}

function normalizeFeedback(body = {}) {
  return {
    id: body.id || `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(body.type || 'feedback').trim(),
    rating: body.rating === '' || body.rating === undefined ? null : Number(body.rating),
    title: String(body.title || '').trim(),
    detail: String(body.detail || '').trim(),
    route: String(body.route || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    createdAt: body.createdAt || new Date().toISOString(),
  };
}

async function listFeedback() {
  await ensureFeedbackTable();
  const { rows } = await pgPool.query('select id, type, rating, title, detail, route, email, created_at from beta_feedback order by created_at desc limit 100');
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    rating: row.rating,
    title: row.title,
    detail: row.detail,
    route: row.route,
    email: row.email,
    createdAt: row.created_at,
  }));
}

async function saveFeedback(record) {
  await ensureFeedbackTable();
  await pgPool.query(
    `insert into beta_feedback (id, type, rating, title, detail, route, email, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       type = excluded.type,
       rating = excluded.rating,
       title = excluded.title,
       detail = excluded.detail,
       route = excluded.route,
       email = excluded.email`,
    [record.id, record.type, record.rating, record.title, record.detail, record.route, record.email, record.createdAt],
  );
  return record;
}

function normalizeLead(body = {}) {
  return {
    id: body.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    teslaCount: String(body.teslaCount || '1').trim(),
    useCase: String(body.useCase || 'Owner rental').trim(),
    plan: String(body.plan || 'First Tesla free').trim(),
    createdAt: body.createdAt || new Date().toISOString(),
  };
}

async function listLeads() {
  await ensureLeadTable();
  const { rows } = await pgPool.query('select id, name, email, tesla_count, use_case, plan, created_at from beta_leads order by created_at desc limit 100');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    teslaCount: row.tesla_count,
    useCase: row.use_case,
    plan: row.plan,
    createdAt: row.created_at,
  }));
}

async function saveLead(lead) {
  await ensureLeadTable();
  await pgPool.query(
    `insert into beta_leads (id, name, email, tesla_count, use_case, plan, created_at)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update set
       name = excluded.name,
       email = excluded.email,
       tesla_count = excluded.tesla_count,
       use_case = excluded.use_case,
       plan = excluded.plan`,
    [lead.id, lead.name, lead.email, lead.teslaCount, lead.useCase, lead.plan, lead.createdAt],
  );
  return lead;
}

function normalizeRevenueRecord(record = {}) {
  return {
    id: record.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleKey: String(record.vehicleKey || record.vin || record.vehicle || ''),
    vehicleLabel: String(record.vehicleLabel || record.vehicle || ''),
    date: record.date || new Date().toISOString().slice(0, 10),
    source: record.source || 'Manual',
    amount: Number(record.amount) || 0,
    notes: record.notes || '',
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

async function listRevenueRecords() {
  await ensureRevenueTable();
  const { rows } = await pgPool.query('select id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at from fleetos_revenue_records order by created_at desc limit 1000');
  return rows.map((row) => ({
    id: row.id,
    vehicleKey: row.vehicle_key,
    vehicleLabel: row.vehicle_label,
    date: row.record_date,
    source: row.source,
    amount: Number(row.amount || 0),
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

async function saveRevenueRecords(records) {
  await ensureRevenueTable();
  await Promise.all(records.map((record) => pgPool.query(
    `insert into fleetos_revenue_records (id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (id) do update set
       vehicle_key = excluded.vehicle_key,
       vehicle_label = excluded.vehicle_label,
       record_date = excluded.record_date,
       source = excluded.source,
       amount = excluded.amount,
       notes = excluded.notes,
       updated_at = now()`,
    [record.id, record.vehicleKey, record.vehicleLabel, record.date, record.source, record.amount, record.notes, record.createdAt],
  )));
  return listRevenueRecords();
}

function normalizeMemoryEvent(event = {}) {
  return {
    id: event.id || `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || 'Event',
    title: event.title || 'ROBOAGENT event',
    detail: event.detail || '',
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || 'fleetos',
    status: event.status || 'recorded',
    ragReady: Boolean(event.ragReady),
    metadata: event.metadata || {},
  };
}

async function listMemoryEvents() {
  await ensureFleetSchema();
  const { rows } = await pgPool.query(
    `select id, type, title, detail, event_timestamp, source, status, rag_ready, metadata
     from fleetos_memory_events
     order by event_timestamp desc
     limit $1`,
    [MAX_MEMORY_EVENTS],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail || '',
    timestamp: row.event_timestamp,
    source: row.source,
    status: row.status,
    ragReady: Boolean(row.rag_ready),
    metadata: row.metadata || {},
  }));
}

async function saveMemoryEvents(incoming) {
  const normalized = incoming.map(normalizeMemoryEvent);
  await ensureFleetSchema();
  await Promise.all(normalized.map((event) => pgPool.query(
    `insert into fleetos_memory_events (id, type, title, detail, event_timestamp, source, status, rag_ready, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set
       type = excluded.type,
       title = excluded.title,
       detail = excluded.detail,
       event_timestamp = excluded.event_timestamp,
       source = excluded.source,
       status = excluded.status,
       rag_ready = excluded.rag_ready,
       metadata = excluded.metadata`,
    [event.id, event.type, event.title, event.detail, event.timestamp, event.source, event.status, event.ragReady, JSON.stringify(event.metadata || {})],
  )));
  return listMemoryEvents();
}

async function clearMemoryEvents() {
  await ensureFleetSchema();
  await pgPool.query('delete from fleetos_memory_events');
  return [];
}

async function listAssetRecords() {
  await ensureFleetSchema();
  const { rows } = await pgPool.query('select vehicle_key, record from fleetos_vehicle_assets order by updated_at desc');
  return Object.fromEntries(rows.map((row) => [row.vehicle_key, row.record || {}]));
}

async function saveAssetRecord(key, record) {
  await ensureFleetSchema();
  await pgPool.query(
    `insert into fleetos_vehicle_assets (
      vehicle_key, vin, model, model_year, trim, color, tag, purchase_date, purchase_year,
      price_paid, current_balance, lender, monthly_payment, insurance_renewal, registration_state, record, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
    on conflict (vehicle_key) do update set
      vin = excluded.vin,
      model = excluded.model,
      model_year = excluded.model_year,
      trim = excluded.trim,
      color = excluded.color,
      tag = excluded.tag,
      purchase_date = excluded.purchase_date,
      purchase_year = excluded.purchase_year,
      price_paid = excluded.price_paid,
      current_balance = excluded.current_balance,
      lender = excluded.lender,
      monthly_payment = excluded.monthly_payment,
      insurance_renewal = excluded.insurance_renewal,
      registration_state = excluded.registration_state,
      record = excluded.record,
      updated_at = now()`,
    [
      key,
      record.vin || null,
      record.model || null,
      record.modelYear || null,
      record.trim || null,
      record.color || null,
      record.tag || null,
      record.purchaseDate || null,
      record.purchaseYear || null,
      record.pricePaid || null,
      record.currentBalance || null,
      record.lender || null,
      record.monthlyPayment || null,
      record.insuranceRenewal || null,
      record.registrationState || null,
      JSON.stringify(record),
    ],
  );
  return listAssetRecords();
}

async function deleteAssetRecords(key) {
  await ensureFleetSchema();
  if (key) {
    await pgPool.query('delete from fleetos_vehicle_assets where vehicle_key = $1', [key]);
  } else {
    await pgPool.query('delete from fleetos_vehicle_assets');
  }
  return listAssetRecords();
}

app.get('/api/memory', async (req, res) => {
  if (!requirePostgres(res, 'fleet memory')) return;
  res.json({ events: await listMemoryEvents(), postgres: Boolean(pgPool) });
});

app.post('/api/memory', async (req, res) => {
  if (!requirePostgres(res, 'fleet memory')) return;
  const incoming = Array.isArray(req.body?.events)
    ? req.body.events
    : req.body?.event
      ? [req.body.event]
      : [];

  res.json({ events: await saveMemoryEvents(incoming), postgres: Boolean(pgPool) });
});

app.delete('/api/memory', async (req, res) => {
  if (!requirePostgres(res, 'fleet memory')) return;
  res.json({ events: await clearMemoryEvents(), postgres: Boolean(pgPool) });
});

app.get('/api/assets', async (req, res) => {
  if (!requirePostgres(res, 'asset records')) return;
  res.json({ records: await listAssetRecords(), postgres: Boolean(pgPool) });
});

app.post('/api/assets', async (req, res) => {
  if (!requirePostgres(res, 'asset records')) return;
  const { key, record } = req.body || {};

  if (!key || !record) {
    res.status(400).json({ error: 'ASSET_RECORD_MISSING' });
    return;
  }

  res.json({ records: await saveAssetRecord(key, record), postgres: Boolean(pgPool) });
});

app.delete('/api/assets', async (req, res) => {
  if (!requirePostgres(res, 'asset records')) return;
  res.json({ records: await deleteAssetRecords(req.query?.key), postgres: Boolean(pgPool) });
});

app.get('/api/leads', async (req, res) => {
  if (!requirePostgres(res, 'early access leads')) return;
  const leads = await listLeads();
  res.json({
    count: leads.length,
    leads: leads.slice(0, 25),
    postgres: Boolean(pgPool),
  });
});

app.post('/api/leads', async (req, res) => {
  if (!requirePostgres(res, 'early access leads')) return;
  const lead = normalizeLead(req.body);

  if (!lead.email || !lead.email.includes('@')) {
    res.status(400).json({
      error: 'EMAIL_REQUIRED',
      message: 'Enter a valid email address.',
    });
    return;
  }

  console.log('ROBOAGENT early access lead', {
    email: lead.email,
    teslaCount: lead.teslaCount,
    useCase: lead.useCase,
    plan: lead.plan,
  });

  res.status(201).json({ ok: true, lead: await saveLead(lead), postgres: Boolean(pgPool) });
});

app.get('/api/revenue', async (req, res) => {
  if (!requirePostgres(res, 'revenue records')) return;
  res.json({ records: await listRevenueRecords(), postgres: Boolean(pgPool) });
});

app.post('/api/revenue', async (req, res) => {
  if (!requirePostgres(res, 'revenue records')) return;
  const incoming = Array.isArray(req.body?.records)
    ? req.body.records
    : req.body?.record
      ? [req.body.record]
      : [];

  res.status(201).json({ records: await saveRevenueRecords(incoming.map(normalizeRevenueRecord)), postgres: Boolean(pgPool) });
});

app.delete('/api/revenue', async (req, res) => {
  if (!requirePostgres(res, 'revenue records')) return;
  await ensureRevenueTable();
  await pgPool.query('delete from fleetos_revenue_records');
  res.json({ records: [], postgres: Boolean(pgPool) });
});

app.get('/api/feedback', async (req, res) => {
  if (!requirePostgres(res, 'beta feedback')) return;
  try {
    res.json({ feedback: await listFeedback(), postgres: Boolean(pgPool) });
  } catch (error) {
    res.status(500).json({ error: 'FEEDBACK_UNAVAILABLE', message: error.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  if (!requirePostgres(res, 'beta feedback')) return;
  try {
    const record = normalizeFeedback(req.body);
    if (!record.title || !record.detail) {
      res.status(400).json({ error: 'FEEDBACK_REQUIRED', message: 'Title and detail are required.' });
      return;
    }
    res.status(201).json({ ok: true, feedback: await saveFeedback(record), postgres: Boolean(pgPool) });
  } catch (error) {
    res.status(500).json({ error: 'FEEDBACK_SAVE_FAILED', message: error.message });
  }
});

app.get('/api/admin', async (req, res) => {
  const feedback = await listFeedback().catch(() => []);
  const leads = await listLeads().catch(() => []);
  const revenue = await listRevenueRecords().catch(() => []);
  const memory = await listMemoryEvents().catch(() => []);
  const assets = await listAssetRecords().catch(() => ({}));
  const [vehicleCount, telemetrySnapshotCount] = pgPool
    ? await Promise.all([
      ensureFleetSchema().then(() => pgPool.query('select count(*)::int as count from fleetos_vehicles')).then((result) => result.rows[0]?.count || 0).catch(() => 0),
      ensureFleetSchema().then(() => pgPool.query('select count(*)::int as count from fleetos_telemetry_snapshots')).then((result) => result.rows[0]?.count || 0).catch(() => 0),
    ])
    : [0, 0];
  res.json({
    postgres: Boolean(pgPool),
    feedbackCount: feedback.length,
    leadCount: leads.length,
    revenueRecordCount: revenue.length,
    revenueTotal: revenue.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    memoryEventCount: memory.length,
    assetRecordCount: Object.keys(assets).length,
    vehicleCount,
    telemetrySnapshotCount,
    latestFeedback: feedback.slice(0, 10),
    latestLeads: leads.slice(0, 10),
    generatedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(
    tokenCache.accessToken || hasRefreshConfig()
      ? 'Tesla Fleet API telemetry is configured'
      : 'Tesla Fleet API credentials are not configured; frontend will stay in simulation mode',
  );
});
