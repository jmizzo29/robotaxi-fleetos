import { getTeslaConnectionForSession, getTeslaScopeStatusForSession, teslaRequestForSession } from '../_lib/auth.js';
import { auditEvent } from '../_lib/security.js';
import { redirectUriFromRequest } from './login.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  let connectionResult = null;
  let connectionError = null;
  try {
    connectionResult = await getTeslaConnectionForSession(req, res);
  } catch (error) {
    connectionError = error;
  }

  await auditEvent({
    userId: connectionResult?.session?.userId || null,
    action: 'tesla_diagnostics_viewed',
    resource: 'tesla',
  }).catch(() => {});
  const checks = {
    backend: { ok: true, runtime: 'vercel' },
    credentials: {
      ok: Boolean(connectionResult?.connection),
      perUserToken: Boolean(connectionResult?.connection),
      clientIdConfigured: Boolean(process.env.TESLA_CLIENT_ID),
      clientSecretConfigured: Boolean(process.env.TESLA_CLIENT_SECRET),
      connectedAt: connectionResult?.connection?.connected_at || null,
    },
    fleetApiBaseConfigured: Boolean(DEFAULT_FLEET_API_BASE),
    partnerDomainConfigured: Boolean(process.env.TESLA_PARTNER_DOMAIN),
    oauth: {
      redirectUri: redirectUriFromRequest(req),
      redirectUriConfigured: Boolean(process.env.TESLA_REDIRECT_URI),
      expectedRegisteredRedirectUri: redirectUriFromRequest(req),
      message: 'Tesla Developer Console must register this exact redirect URI for the active client_id.',
    },
    token: null,
    vehicles: null,
    location: null,
    charging: null,
  };

  if (!connectionResult?.connection) {
    res.status(200).json({
      ...checks,
      token: {
        ok: false,
        message: connectionError?.status === 401
          ? 'Sign in to check Tesla connection health.'
          : 'Tesla is not connected for this ROBOAGENT user.',
      },
    });
    return;
  }

  try {
    const payload = await teslaRequestForSession(req, res, '/api/1/vehicles', {
      baseURL: DEFAULT_FLEET_API_BASE,
    });
    const vehicles = payload.response || [];
    const teslaScopes = await getTeslaScopeStatusForSession(req, res);
    checks.token = { ok: true, scopes: teslaScopes.scopes, hasChargingCmds: teslaScopes.hasChargingCmds };
    checks.charging = {
      ok: teslaScopes.hasChargingCmds,
      hasChargingCmds: teslaScopes.hasChargingCmds,
      message: teslaScopes.hasChargingCmds
        ? 'vehicle_charging_cmds is granted for this Tesla connection.'
        : 'Charging history needs Tesla charging permission. Connect Tesla again to grant it. The app is not broken.',
    };
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
    checks.token = { ok: false, message: error.message };
    checks.vehicles = { ok: false, message: error.message };
  }

  res.status(200).json(checks);
}
