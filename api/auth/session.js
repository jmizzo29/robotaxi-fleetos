import { getBillingStatusForSession, getSession, getTeslaConnectionForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for user sessions.' });
    return;
  }

  let session;
  try {
    session = await getSession(req, res, { create: true });
  } catch (error) {
    res.status(error.status || 500).json({
      authenticated: false,
      error: error.status === 401 ? 'LOGIN_REQUIRED' : 'AUTH_UNAVAILABLE',
      message: error.status === 401 ? 'Sign in to FleetOS to continue.' : 'FleetOS authentication is not available.',
    });
    return;
  }
  if (!session) {
    res.status(401).json({
      authenticated: false,
      error: 'LOGIN_REQUIRED',
      message: 'Sign in to FleetOS to continue.',
    });
    return;
  }
  const tesla = await getTeslaConnectionForSession(req, res);
  const billing = await getBillingStatusForSession(req, res, { create: true });
  res.status(200).json({
    authenticated: true,
    user: session.user,
    sessionId: session.id,
    billing,
    teslaConnected: Boolean(tesla?.connection),
    teslaConnectedAt: tesla?.connection?.connected_at || null,
  });
}
