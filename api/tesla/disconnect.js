import { disconnectTesla } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

function mapDisconnectError(error) {
  if (error?.code === 'LOGIN_REQUIRED' || error?.status === 401) {
    return {
      status: 401,
      body: {
        error: 'LOGIN_REQUIRED',
        message: 'Sign in before disconnecting Tesla.',
      },
    };
  }

  if (String(error?.message || '').includes('DATABASE_URL')) {
    return {
      status: 503,
      body: {
        error: 'DATABASE_REQUIRED',
        message: 'Postgres is required for Tesla connections.',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'TESLA_DISCONNECT_FAILED',
      message: 'Unable to remove the Tesla connection. Try again.',
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    console.error('[ROBOAGENT][TeslaDisconnect] database_unavailable');
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres is required for Tesla connections.',
    });
    return;
  }

  try {
    const result = await disconnectTesla(req, res);
    res.status(200).json({
      ok: true,
      teslaConnected: false,
      hadActiveConnection: result.hadActiveConnection,
      message: result.message,
    });
  } catch (error) {
    console.error('[ROBOAGENT][TeslaDisconnect] failed', {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    const mapped = mapDisconnectError(error);
    res.status(mapped.status).json(mapped.body);
  }
}
