import { getSession, teslaRequestForSession } from '../../../_lib/auth.js';
import { RATE_LIMITS, checkVinRateLimit } from '../../../_lib/rateLimits.js';
import { auditEvent } from '../../../_lib/security.js';
import { MISSING_CHARGING_SCOPE_MESSAGE, isMissingChargingScopeError } from '../../../_lib/teslaScopes.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

const COMMANDS = {
  start: { path: 'charge_start', label: 'start charging' },
  stop: { path: 'charge_stop', label: 'stop charging' },
  set_limit: { path: 'set_charge_limit', label: 'set charge limit' },
};

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return typeof req.body === 'object' ? req.body : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const vin = req.query?.vin;
  const body = readBody(req);
  const action = String(body.action || '').trim().toLowerCase();
  const command = COMMANDS[action];

  if (!vin) {
    res.status(400).json({ error: 'TESLA_VEHICLE_MISSING', message: 'A Tesla VIN is required.' });
    return;
  }

  if (!command) {
    res.status(400).json({
      error: 'TESLA_CHARGE_COMMAND_INVALID',
      message: 'Use start, stop, or set_limit.',
    });
    return;
  }

  const percent = action === 'set_limit' ? Number(body.percent) : null;
  if (action === 'set_limit' && (!Number.isFinite(percent) || percent < 50 || percent > 100)) {
    res.status(400).json({
      error: 'TESLA_CHARGE_LIMIT_INVALID',
      message: 'Charge limit must be between 50 and 100 percent.',
    });
    return;
  }

  try {
    const session = await getSession(req, res, { create: false });
    if (!session) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in before sending a charging command.' });
      return;
    }

    const rateLimit = await checkVinRateLimit({
      userId: session.userId,
      vin,
      action: 'command',
      config: RATE_LIMITS.command,
      metadata: { source: 'charging_command', teslaAction: action },
    });

    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds || RATE_LIMITS.command.windowSeconds));
      res.status(429).json({
        error: 'TESLA_COMMAND_RATE_LIMITED',
        message: rateLimit.warning.message,
        warning: rateLimit.warning,
      });
      return;
    }

    const payload = await teslaRequestForSession(
      req,
      res,
      `/api/1/vehicles/${encodeURIComponent(vin)}/command/${command.path}`,
      {
        baseURL: DEFAULT_FLEET_API_BASE,
        method: 'POST',
        body: action === 'set_limit' ? { percent } : undefined,
      },
    );

    await auditEvent({
      userId: session.userId,
      action: `tesla_charge_${action}`,
      resource: vin,
      metadata: { percent, teslaAction: action },
    }).catch(() => {});

    res.status(200).json({
      ...payload,
      warning: rateLimit.warning,
    });
  } catch (error) {
    if (isMissingChargingScopeError(error)) {
      res.status(403).json({
        error: 'MISSING_CHARGING_SCOPE',
        message: MISSING_CHARGING_SCOPE_MESSAGE,
        hasChargingCmds: false,
      });
      return;
    }

    res.status(error.status || 502).json({
      error: error.status === 401 ? 'TESLA_LOGIN_REQUIRED' : 'TESLA_CHARGE_COMMAND_UNAVAILABLE',
      message: error.message,
    });
  }
}
