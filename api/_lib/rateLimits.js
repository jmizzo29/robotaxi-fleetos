import { query } from './db.js';
import { auditEvent } from './security.js';

export const RATE_LIMITS = {
  telemetry_cache_seconds: Number(process.env.TELEMETRY_CACHE_SECONDS || 45),
  wake: {
    limit: Number(process.env.TESLA_WAKE_LIMIT || 2),
    windowSeconds: Number(process.env.TESLA_WAKE_WINDOW_SECONDS || 60),
    warnAt: Number(process.env.TESLA_WAKE_WARN_AT || 1),
  },
  command: {
    limit: Number(process.env.TESLA_COMMAND_LIMIT || 3),
    windowSeconds: Number(process.env.TESLA_COMMAND_WINDOW_SECONDS || 60),
    warnAt: Number(process.env.TESLA_COMMAND_WARN_AT || 2),
  },
};

function normalizeVin(vin) {
  return String(vin || '').trim().toUpperCase();
}

export function rateLimitWarning({ action, count, config }) {
  if (!config || count < config.warnAt) return null;
  const remaining = Math.max(config.limit - count, 0);
  return {
    action,
    remaining,
    limit: config.limit,
    windowSeconds: config.windowSeconds,
    message: remaining === 0
      ? `${action} limit reached for this vehicle. Wait before trying again.`
      : `${action} limit is close for this vehicle. ${remaining} attempt${remaining === 1 ? '' : 's'} left in the current window.`,
  };
}

export async function recordRateLimitEvent({
  userId,
  vin,
  action,
  status = 'recorded',
  config,
  retryAfterSeconds = null,
  metadata = {},
}) {
  const normalizedVin = normalizeVin(vin);
  if (!normalizedVin || !action || !config) return;

  await query(
    `insert into fleetos_rate_limit_events (
      user_id, vin, action, status, limit_count, window_seconds, retry_after_seconds, metadata
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId || null,
      normalizedVin,
      action,
      status,
      config.limit,
      config.windowSeconds,
      retryAfterSeconds,
      JSON.stringify(metadata),
    ],
  );

  if (status === 'blocked' || status === 'warning') {
    await auditEvent({
      userId,
      action: `rate_limit_${status}`,
      resource: normalizedVin,
      metadata: { actionType: action, retryAfterSeconds, ...metadata },
    }).catch(() => {});
  }
}

export async function checkVinRateLimit({
  userId,
  vin,
  action,
  config = RATE_LIMITS.command,
  metadata = {},
}) {
  const normalizedVin = normalizeVin(vin);
  if (!normalizedVin || !action || !config?.limit || !config?.windowSeconds) {
    return { allowed: true, warning: null };
  }

  const { rows } = await query(
    `select count(*)::int as count, min(created_at) as oldest
     from fleetos_rate_limit_events
     where user_id = $1
       and vin = $2
       and action = $3
       and status in ('recorded', 'warning')
       and created_at > now() - ($4::text || ' seconds')::interval`,
    [userId, normalizedVin, action, config.windowSeconds],
  );

  const count = rows[0]?.count || 0;
  if (count >= config.limit) {
    const oldest = rows[0]?.oldest ? new Date(rows[0].oldest).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - oldest) / 1000));
    const retryAfterSeconds = Math.max(1, config.windowSeconds - elapsedSeconds);
    await recordRateLimitEvent({
      userId,
      vin: normalizedVin,
      action,
      status: 'blocked',
      config,
      retryAfterSeconds,
      metadata,
    });
    return {
      allowed: false,
      retryAfterSeconds,
      warning: {
        action,
        remaining: 0,
        limit: config.limit,
        windowSeconds: config.windowSeconds,
        message: `${action} limit reached for this vehicle. Try again in about ${retryAfterSeconds} seconds.`,
      },
    };
  }

  const projectedCount = count + 1;
  const warning = rateLimitWarning({ action, count: projectedCount, config });
  await recordRateLimitEvent({
    userId,
    vin: normalizedVin,
    action,
    status: warning ? 'warning' : 'recorded',
    config,
    metadata,
  });

  return { allowed: true, warning };
}
