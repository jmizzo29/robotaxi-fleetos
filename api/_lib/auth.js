import crypto from 'crypto';
import { getVerifiedClerkSession, isClerkAuthRequired } from './clerkAuth.js';
import { ensureFleetSchema, query } from './db.js';
import { resolveMissingSession } from './prodGuards.js';
import { hasChargingCmds, scopesFromTokenAndRecord } from './teslaScopes.js';

const SESSION_COOKIE = 'fleetos_session';
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;
const TESLA_AUTH_URL = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function betaInviteCode() {
  return process.env.BETA_INVITE_CODE || process.env.FLEETOS_BETA_INVITE_CODE || 'RoboAgent-BETA';
}

export function validateInviteCode(inviteCode) {
  return String(inviteCode || '').trim().toUpperCase() === betaInviteCode().toUpperCase();
}

export function hashToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('base64url');
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('base64url'));
    });
  });
  return `scrypt$${salt}$${derived}`;
}

export async function verifyPassword(password, storedHash) {
  const [scheme, salt, expected] = String(storedHash || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('base64url'));
    });
  });
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function cookieOptions(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function setSessionCookie(res, sessionId) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; ${cookieOptions(SESSION_DAYS * 86400)}`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(0)}`);
}

export function getSessionId(req) {
  return parseCookies(req)[SESSION_COOKIE] || null;
}

export async function createSessionForUser(userId, res) {
  await ensureFleetSchema();
  const sessionId = randomId('sess');
  await query(
    `insert into fleetos_sessions (id, user_id, expires_at)
     values ($1, $2, now() + interval '${SESSION_DAYS} days')`,
    [sessionId, userId],
  );
  setSessionCookie(res, sessionId);
  return { id: sessionId, userId };
}

export async function createAnonymousSession(res) {
  await ensureFleetSchema();
  const userId = randomId('user');
  const sessionId = randomId('sess');
  await query(
    `insert into fleetos_users (id, role) values ($1, 'owner')
     on conflict (id) do nothing`,
    [userId],
  );
  await query(
    `insert into fleetos_sessions (id, user_id, expires_at)
     values ($1, $2, now() + interval '${SESSION_DAYS} days')`,
    [sessionId, userId],
  );
  setSessionCookie(res, sessionId);
  await ensureBillingEntitlement(userId);
  return { id: sessionId, userId };
}

export async function getSession(req, res, { create = false } = {}) {
  await ensureFleetSchema();
  let clerkSession = null;
  let clerkError = null;
  try {
    clerkSession = await getVerifiedClerkSession(req);
  } catch (error) {
    // Defer Clerk failures until after the native cookie session is checked.
    // When Clerk auth is marked required, requests without a Clerk token used
    // to 401 here immediately, which locked out valid Tesla-OAuth cookie
    // sessions on every create:false endpoint (e.g. GET /api/auth/session).
    clerkError = error;
  }
  if (clerkSession) {
    await ensureBillingEntitlement(clerkSession.userId, clerkSession.user?.email);
    return clerkSession;
  }

  const sessionId = getSessionId(req);
  if (sessionId) {
    const { rows } = await query(
      `select s.id, s.user_id, u.email, u.name, u.role
       from fleetos_sessions s
       join fleetos_users u on u.id = s.user_id
       where s.id = $1 and s.expires_at > now()`,
      [sessionId],
    );
    if (rows[0]) {
      await query('update fleetos_sessions set last_seen_at = now() where id = $1', [sessionId]);
      return {
        id: rows[0].id,
        userId: rows[0].user_id,
        user: {
          id: rows[0].user_id,
          email: rows[0].email,
          name: rows[0].name,
          role: rows[0].role,
        },
      };
    }
  }

  const fallback = resolveMissingSession({
    clerkRequired: isClerkAuthRequired(),
    create,
    clerkError,
  });
  if (fallback.action === 'throw') {
    throw fallback.error;
  }
  if (fallback.action === 'deny') return null;

  const created = await createAnonymousSession(res);
  return {
    ...created,
    user: { id: created.userId, email: null, name: null, role: 'owner' },
  };
}

export async function getDefaultFleetForSession(req, res, { create = true } = {}) {
  const session = await getSession(req, res, { create });
  if (!session) return null;

  const existing = await query(
    `select id, name from fleetos_fleets
     where owner_user_id = $1
     order by created_at asc
     limit 1`,
    [session.userId],
  );

  if (existing.rows[0]) {
    return { session, fleet: existing.rows[0] };
  }

  if (!create) return { session, fleet: null };

  const fleetId = `fleet-${Date.now()}-${crypto.randomBytes(10).toString('hex')}`;
  const created = await query(
    `insert into fleetos_fleets (id, owner_user_id, name, plan)
     values ($1, $2, $3, 'first_tesla_free')
     returning id, name`,
    [fleetId, session.userId, 'My Tesla Fleet'],
  );
  return { session, fleet: created.rows[0] };
}

export async function ensureBillingEntitlement(userId, email = null) {
  await ensureFleetSchema();
  await query(
    `insert into fleetos_billing_entitlements (
      user_id, plan, status, included_vehicles, paid_vehicle_limit, billing_email, updated_at
    ) values ($1, 'first_tesla_free', 'free', 1, 0, $2, now())
    on conflict (user_id) do update set
      billing_email = coalesce(fleetos_billing_entitlements.billing_email, excluded.billing_email),
      updated_at = now()`,
    [userId, email],
  );
}

export async function createAccount({ email, password, name, res, existingSession = null }) {
  await ensureFleetSchema();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail.includes('@')) {
    const error = new Error('Enter a valid email address.');
    error.status = 400;
    throw error;
  }
  if (!password || String(password).length < 8) {
    const error = new Error('Use a password with at least 8 characters.');
    error.status = 400;
    throw error;
  }

  const existingEmail = await query('select id from fleetos_users where email = $1 limit 1', [normalizedEmail]);
  if (existingEmail.rows[0] && existingEmail.rows[0].id !== existingSession?.userId) {
    const error = new Error('An account already exists for that email.');
    error.status = 409;
    throw error;
  }

  const userId = existingSession?.userId || randomId('user');
  const passwordHash = await hashPassword(password);
  await query(
    `insert into fleetos_users (id, email, name, password_hash, email_verified_at, auth_provider, role, updated_at)
     values ($1, $2, $3, $4, now(), 'fleetos', 'owner', now())
     on conflict (id) do update set
       email = excluded.email,
       name = excluded.name,
       password_hash = excluded.password_hash,
       email_verified_at = coalesce(fleetos_users.email_verified_at, excluded.email_verified_at),
       auth_provider = 'fleetos',
       updated_at = now()`,
    [userId, normalizedEmail, String(name || '').trim() || null, passwordHash],
  );

  await ensureBillingEntitlement(userId, normalizedEmail);
  const session = await createSessionForUser(userId, res);
  return {
    session,
    user: {
      id: userId,
      email: normalizedEmail,
      name: String(name || '').trim() || null,
      role: 'owner',
    },
  };
}

export async function findUserByEmail(email) {
  await ensureFleetSchema();
  const normalizedEmail = normalizeEmail(email);
  const { rows } = await query(
    `select id, email, name, role, password_hash, email_verified_at
     from fleetos_users
     where email = $1
     limit 1`,
    [normalizedEmail],
  );
  return rows[0] || null;
}

export async function createMagicLink({ email, origin }) {
  await ensureFleetSchema();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail.includes('@')) {
    const error = new Error('Enter a valid email address.');
    error.status = 400;
    throw error;
  }
  let user = await findUserByEmail(normalizedEmail);
  if (!user) {
    const userId = randomId('user');
    await query(
      `insert into fleetos_users (id, email, email_verified_at, auth_provider, role)
       values ($1, $2, null, 'fleetos', 'owner')`,
      [userId, normalizedEmail],
    );
    await ensureBillingEntitlement(userId, normalizedEmail);
    user = { id: userId, email: normalizedEmail };
  }

  const token = crypto.randomBytes(32).toString('base64url');
  await query(
    `insert into fleetos_magic_links (token_hash, email, user_id, expires_at)
     values ($1, $2, $3, now() + interval '${MAGIC_LINK_MINUTES} minutes')`,
    [hashToken(token), normalizedEmail, user.id],
  );

  const base = String(origin || process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return {
    token,
    magicLink: `${base}/api/auth/magic/verify?token=${encodeURIComponent(token)}`,
    expiresInMinutes: MAGIC_LINK_MINUTES,
  };
}

export async function consumeMagicLink({ token, res }) {
  await ensureFleetSchema();
  const tokenHash = hashToken(token);
  const { rows } = await query(
    `update fleetos_magic_links
     set consumed_at = now()
     where token_hash = $1
       and consumed_at is null
       and expires_at > now()
     returning user_id, email`,
    [tokenHash],
  );
  if (!rows[0]) {
    const error = new Error('This magic link is invalid or expired.');
    error.status = 400;
    throw error;
  }

  await query(
    `update fleetos_users
     set email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
     where id = $1`,
    [rows[0].user_id],
  );
  await ensureBillingEntitlement(rows[0].user_id, rows[0].email);
  return createSessionForUser(rows[0].user_id, res);
}

export async function updateCurrentUserProfile(req, res, profile = {}) {
  const session = await getSession(req, res);
  if (!session) return null;
  const name = String(profile.name || '').trim() || null;
  const { rows } = await query(
    `update fleetos_users
     set name = $1, updated_at = now()
     where id = $2
     returning id, email, name, role, email_verified_at`,
    [name, session.userId],
  );
  return rows[0] || null;
}

export async function getBillingStatusForSession(req, res, { create = true } = {}) {
  const context = await getDefaultFleetForSession(req, res, { create });
  if (!context?.session) return null;
  await ensureBillingEntitlement(context.session.userId, context.session.user?.email);
  const entitlement = await query(
    `select plan, status, included_vehicles, paid_vehicle_limit, billing_email
     from fleetos_billing_entitlements
     where user_id = $1`,
    [context.session.userId],
  );
  const vehicleCount = context.fleet
    ? await query('select count(*)::int as count from fleetos_vehicles where fleet_id = $1', [context.fleet.id])
    : { rows: [{ count: 0 }] };
  const row = entitlement.rows[0] || {
    plan: 'first_tesla_free',
    status: 'free',
    included_vehicles: 1,
    paid_vehicle_limit: 0,
    billing_email: context.session.user?.email || null,
  };
  const includedVehicles = Number(row.included_vehicles || 1);
  const paidVehicleLimit = Number(row.paid_vehicle_limit || 0);
  const count = Number(vehicleCount.rows[0]?.count || 0);
  const coveredVehicles = includedVehicles + paidVehicleLimit;
  return {
    plan: row.plan,
    status: row.status,
    billingEmail: row.billing_email,
    includedVehicles,
    paidVehicleLimit,
    coveredVehicles,
    vehicleCount: count,
    billableVehicles: Math.max(0, count - includedVehicles),
    billingRequired: count > coveredVehicles,
  };
}

export async function deleteCurrentUserData(req, res) {
  const session = await getSession(req, res);
  if (!session) return { deleted: false };

  await ensureFleetSchema();
  const fleets = await query('select id from fleetos_fleets where owner_user_id = $1', [session.userId]);
  const fleetIds = fleets.rows.map((row) => row.id);

  if (fleetIds.length > 0) {
    await query(
      `delete from fleetos_telemetry_snapshots
       where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))`,
      [fleetIds],
    );
    await query('delete from fleetos_memory_events where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_revenue_records where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_vehicle_assets where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_earnings_estimates where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_maintenance_logs where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))', [fleetIds]);
    await query('delete from fleetos_vehicles where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_fleet_members where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_fleets where id = any($1::text[])', [fleetIds]);
  }

  await query('delete from fleetos_oauth_states where session_id in (select id from fleetos_sessions where user_id = $1)', [session.userId]);
  await query('delete from fleetos_push_subscriptions where user_id = $1', [session.userId]);
  await query('delete from fleetos_owner_alert_sends where user_id = $1', [session.userId]);
  await query('delete from fleetos_owner_alert_prefs where user_id = $1', [session.userId]);
  await query('delete from fleetos_magic_links where user_id = $1', [session.userId]);
  await query('delete from fleetos_billing_entitlements where user_id = $1', [session.userId]);
  await query('delete from fleetos_tesla_connections where user_id = $1', [session.userId]);
  await query('delete from fleetos_sessions where user_id = $1', [session.userId]);
  await query('delete from fleetos_users where id = $1', [session.userId]);
  clearSessionCookie(res);
  return {
    deleted: true,
    fleetCount: fleetIds.length,
  };
}

function encryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.FLEETOS_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be set to store Tesla tokens.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptToken(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptToken(payload) {
  if (!payload) return null;
  const [ivRaw, tagRaw, encryptedRaw] = payload.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export async function getTeslaConnectionForSession(req, res) {
  const session = await getSession(req, res);
  if (!session) return null;
  const { rows } = await query(
    `select * from fleetos_tesla_connections
     where user_id = $1 and provider = 'tesla' and revoked_at is null
     order by updated_at desc
     limit 1`,
    [session.userId],
  );
  return rows[0] ? { session, connection: rows[0] } : { session, connection: null };
}

export async function saveTeslaConnection({ userId, tokenPayload }) {
  const refreshToken = tokenPayload.refresh_token;
  if (!refreshToken) {
    throw new Error('Tesla OAuth did not return a refresh token.');
  }
  const connectionId = randomId('tesla');
  const expiresAt = new Date(Date.now() + Math.max((tokenPayload.expires_in || 3600) - 90, 60) * 1000).toISOString();

  await query(
    `insert into fleetos_tesla_connections (
      id, user_id, provider, tesla_subject, access_token_enc, refresh_token_enc,
      token_type, scope, expires_at, updated_at, revoked_at
    ) values ($1, $2, 'tesla', $3, $4, $5, $6, $7, $8, now(), null)
    on conflict (user_id, provider) do update set
      tesla_subject = excluded.tesla_subject,
      access_token_enc = excluded.access_token_enc,
      refresh_token_enc = excluded.refresh_token_enc,
      token_type = excluded.token_type,
      scope = excluded.scope,
      expires_at = excluded.expires_at,
      updated_at = now(),
      revoked_at = null`,
    [
      connectionId,
      userId,
      tokenPayload.id_token ? null : null,
      encryptToken(tokenPayload.access_token),
      encryptToken(refreshToken),
      tokenPayload.token_type || 'Bearer',
      tokenPayload.scope || null,
      expiresAt,
    ],
  );
}

export async function refreshTeslaTokenForConnection(connection) {
  const refreshToken = decryptToken(connection.refresh_token_enc);
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.TESLA_CLIENT_ID,
    refresh_token: refreshToken,
  });

  if (process.env.TESLA_CLIENT_SECRET) {
    form.set('client_secret', process.env.TESLA_CLIENT_SECRET);
  }

  const response = await fetch(TESLA_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Tesla token refresh failed with ${response.status}`);
  }

  const tokenText = await response.text();
  if (!tokenText) {
    throw new Error('Tesla token refresh returned an empty response.');
  }
  const data = JSON.parse(tokenText);
  const nextRefreshToken = data.refresh_token || refreshToken;
  const expiresAt = new Date(Date.now() + Math.max((data.expires_in || 3600) - 90, 60) * 1000).toISOString();
  await query(
    `update fleetos_tesla_connections
     set access_token_enc = $1, refresh_token_enc = $2, token_type = $3, scope = coalesce($4, scope),
       expires_at = $5, updated_at = now()
     where id = $6`,
    [
      encryptToken(data.access_token),
      encryptToken(nextRefreshToken),
      data.token_type || connection.token_type || 'Bearer',
      data.scope || null,
      expiresAt,
      connection.id,
    ],
  );
  return data.access_token;
}

export async function getTeslaAccessTokenForRequest(req, res) {
  const result = await getTeslaConnectionForSession(req, res);
  if (!result?.connection) {
    const error = new Error('Connect Tesla for this ROBOAGENT user before syncing telemetry.');
    error.status = 401;
    throw error;
  }

  const expiresAt = result.connection.expires_at ? new Date(result.connection.expires_at).getTime() : 0;
  if (result.connection.access_token_enc && expiresAt > Date.now() + 60000) {
    return decryptToken(result.connection.access_token_enc);
  }
  return refreshTeslaTokenForConnection(result.connection);
}

export async function teslaRequestForSession(req, res, path, options = {}) {
  const accessToken = await getTeslaAccessTokenForRequest(req, res);
  const url = new URL(`${options.baseURL || DEFAULT_FLEET_API_BASE}${path}`);
  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message = parsed?.error_description
      || parsed?.error
      || parsed?.message
      || text
      || `Tesla request failed with ${response.status}`;
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    error.status = response.status;
    error.code = parsed?.error || parsed?.errorcode;
    error.body = parsed;
    throw error;
  }

  if (!text) {
    return { response: {} };
  }
  if (!parsed) {
    throw new Error(`Tesla request returned a non-JSON response for ${path}`);
  }
  return parsed;
}

export async function getTeslaScopeStatusForSession(req, res) {
  const result = await getTeslaConnectionForSession(req, res);
  if (!result?.connection) {
    return { connected: false, scopes: [], hasChargingCmds: false };
  }

  let accessToken = null;
  try {
    const expiresAt = result.connection.expires_at ? new Date(result.connection.expires_at).getTime() : 0;
    if (result.connection.access_token_enc && expiresAt > Date.now() + 60000) {
      accessToken = decryptToken(result.connection.access_token_enc);
    } else {
      accessToken = await getTeslaAccessTokenForRequest(req, res);
    }
  } catch {
    accessToken = null;
  }

  const scopes = scopesFromTokenAndRecord({
    accessToken,
    storedScope: result.connection.scope,
  });

  return {
    connected: true,
    scopes,
    hasChargingCmds: hasChargingCmds(scopes),
  };
}

export async function disconnectTesla(req, res) {
  const session = await getSession(req, res);
  if (!session) {
    const error = new Error('Sign in before disconnecting Tesla.');
    error.status = 401;
    error.code = 'LOGIN_REQUIRED';
    throw error;
  }

  console.info('[ROBOAGENT][TeslaDisconnect] start', {
    userId: session.userId,
    authProvider: session.authProvider || 'fleetos',
  });

  const { rows } = await query(
    `update fleetos_tesla_connections
     set revoked_at = now(),
         access_token_enc = null,
         refresh_token_enc = 'revoked',
         updated_at = now()
     where user_id = $1
       and provider = 'tesla'
       and revoked_at is null
     returning id`,
    [session.userId],
  );

  const hadActiveConnection = rows.length > 0;

  console.info('[ROBOAGENT][TeslaDisconnect] complete', {
    userId: session.userId,
    hadActiveConnection,
    revokedConnectionId: rows[0]?.id || null,
  });

  return {
    disconnected: true,
    hadActiveConnection,
    teslaConnected: false,
    message: hadActiveConnection
      ? 'Tesla account disconnected successfully.'
      : 'No active Tesla connection found.',
  };
}
