import { getTeslaConnectionForSession, teslaRequestForSession } from '../_lib/auth.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const connectionResult = await getTeslaConnectionForSession(req, res);
  const checks = {
    backend: { ok: true, runtime: 'vercel' },
    credentials: {
      ok: Boolean(connectionResult?.connection),
      perUserToken: Boolean(connectionResult?.connection),
      clientId: Boolean(process.env.TESLA_CLIENT_ID),
      clientSecret: Boolean(process.env.TESLA_CLIENT_SECRET),
      connectedAt: connectionResult?.connection?.connected_at || null,
    },
    fleetApiBase: DEFAULT_FLEET_API_BASE,
    partnerDomain: process.env.TESLA_PARTNER_DOMAIN || null,
    token: null,
    vehicles: null,
    location: null,
  };

  if (!connectionResult?.connection) {
    res.status(200).json({
      ...checks,
      token: { ok: false, message: 'Tesla is not connected for this FleetOS user.' },
    });
    return;
  }

  try {
    const payload = await teslaRequestForSession(req, res, '/api/1/vehicles', {
      baseURL: DEFAULT_FLEET_API_BASE,
    });
    const vehicles = payload.response || [];
    checks.token = { ok: true };
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
