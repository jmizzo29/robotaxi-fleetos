import { disconnectTesla } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for Tesla connections.' });
    return;
  }

  try {
    await disconnectTesla(req, res);
    res.status(200).json({ ok: true, teslaConnected: false });
  } catch (error) {
    const status = error.statusCode || error.status || 401;
    res.status(status === 401 ? 401 : 500).json({
      error: status === 401 ? 'LOGIN_REQUIRED' : 'TESLA_DISCONNECT_FAILED',
      message: status === 401 ? 'Sign in before disconnecting Tesla.' : 'Tesla disconnect failed.',
    });
  }
}
