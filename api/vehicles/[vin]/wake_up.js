import { getSession, teslaRequestForSession } from '../../_lib/auth.js';
import { RATE_LIMITS, checkVinRateLimit } from '../../_lib/rateLimits.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
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
    const session = await getSession(req, res, { create: false });
    if (!session) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in before waking a Tesla.' });
      return;
    }

    const rateLimit = await checkVinRateLimit({
      userId: session.userId,
      vin,
      action: 'wake',
      config: RATE_LIMITS.wake,
      metadata: { source: 'wake_up_endpoint' },
    });

    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds || RATE_LIMITS.wake.windowSeconds));
      res.status(429).json({
        error: 'TESLA_WAKE_RATE_LIMITED',
        message: rateLimit.warning.message,
        warning: rateLimit.warning,
      });
      return;
    }

    const payload = await teslaRequestForSession(req, res, `/api/1/vehicles/${encodeURIComponent(vin)}/wake_up`, {
      baseURL: DEFAULT_FLEET_API_BASE,
      method: 'POST',
    });

    res.status(200).json({
      ...payload,
      warning: rateLimit.warning,
    });
  } catch (error) {
    res.status(error.status || 502).json({
      error: error.status === 401 ? 'TESLA_LOGIN_REQUIRED' : 'TESLA_WAKE_UNAVAILABLE',
      message: error.message,
    });
  }
}
