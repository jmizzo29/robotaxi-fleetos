import crypto from 'crypto';

export const DELETE_CONFIRMATION_PHRASE = 'DELETE';
export const DELETE_CONFIRM_TTL_MS = 10 * 60 * 1000;

export function isProductionRuntime(env = process.env) {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';
}

/** GET /api/vehicles?debug=1 is never public. Production removes it entirely. */
export function vehiclesDebugAccess({ debug, authenticated, production }) {
  if (String(debug || '') !== '1') {
    return { allow: false, reason: 'not_requested' };
  }
  if (production) {
    return {
      allow: false,
      status: 404,
      error: 'NOT_FOUND',
      message: 'Debug is not available.',
    };
  }
  if (!authenticated) {
    return {
      allow: false,
      status: 401,
      error: 'LOGIN_REQUIRED',
      message: 'Sign in before requesting vehicle debug.',
    };
  }
  return { allow: true };
}

/**
 * When Clerk is required, never mint a guest cookie session on ordinary APIs.
 * Tesla-first login is the exception: it binds OAuth state to a cookie session
 * via createAnonymousSession in /api/tesla/login, not through getSession().
 */
export function resolveMissingSession({ clerkRequired, create, clerkError } = {}) {
  if (clerkRequired) {
    if (clerkError && clerkError.status !== 401) {
      return { action: 'throw', error: clerkError };
    }
    return { action: 'deny' };
  }
  if (clerkError && !(create && clerkError.status === 401)) {
    return { action: 'throw', error: clerkError };
  }
  if (!create) return { action: 'deny' };
  return { action: 'mint' };
}

/**
 * Tesla-first login may mint a cookie session so OAuth can start.
 * Clerk-required still blocks guest mint on other APIs (resolveMissingSession).
 * Existing sessions (add-vehicle / signed-in) are reused, never reminted.
 */
export function teslaLoginMayCreateSession({ hasSession } = {}) {
  return !hasSession;
}

/** Decision table for GET /api/tesla/login. Never silent-redirect to /#/login. */
export function resolveTeslaLoginStart({ teslaConfigured, hasSession, clerkRequired } = {}) {
  if (!teslaConfigured) {
    return {
      action: 'error',
      status: 503,
      error: 'TESLA_CONFIG_MISSING',
      message: 'TESLA_CLIENT_ID is required for Tesla OAuth.',
    };
  }
  if (hasSession) {
    return { action: 'oauth', mint: false };
  }
  if (teslaLoginMayCreateSession({ clerkRequired, hasSession: false })) {
    return { action: 'mint_then_oauth', mint: true };
  }
  return {
    action: 'error',
    status: 503,
    error: 'TESLA_LOGIN_BLOCKED',
    message: 'Unable to start Tesla connection. Please try again.',
  };
}

function deleteConfirmSecret(env = process.env) {
  return env.TOKEN_ENCRYPTION_KEY
    || env.FLEETOS_TOKEN_SECRET
    || env.SESSION_SECRET
    || env.CLERK_SECRET_KEY
    || 'roboagent-delete-confirm';
}

function hmacSha256(value, env = process.env) {
  return crypto.createHmac('sha256', deleteConfirmSecret(env)).update(String(value)).digest('base64url');
}

export function createDeleteConfirmToken(userId, now = Date.now(), ttlMs = DELETE_CONFIRM_TTL_MS, env = process.env) {
  const exp = now + ttlMs;
  const payload = `${userId}.${exp}`;
  return {
    token: `${payload}.${hmacSha256(payload, env)}`,
    expiresAt: exp,
    expiresInSeconds: Math.round(ttlMs / 1000),
  };
}

export function verifyDeleteConfirmToken(userId, token, now = Date.now(), env = process.env) {
  const raw = String(token || '');
  const parts = raw.split('.');
  if (parts.length < 3) return false;
  const sig = parts.pop();
  const exp = Number(parts.pop());
  const tokenUserId = parts.join('.');
  if (!tokenUserId || tokenUserId !== String(userId) || !Number.isFinite(exp) || exp <= now) {
    return false;
  }
  const payload = `${tokenUserId}.${exp}`;
  const expected = hmacSha256(payload, env);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function isValidDeleteConfirmation(value) {
  return String(value || '').trim() === DELETE_CONFIRMATION_PHRASE;
}

export function parseJsonBody(req) {
  const body = req?.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  if (typeof body === 'string' && body.trim()) {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}
