import crypto from 'crypto';
import { ensureFleetSchema, query } from './db.js';

const SESSION_COOKIE = 'fleetos_session';
const SESSION_DAYS = 30;
const TESLA_AUTH_URL = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';
const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
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
  return { id: sessionId, userId };
}

export async function getSession(req, res, { create = false } = {}) {
  await ensureFleetSchema();
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

  if (!create) return null;
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

  const data = await response.json();
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
    const error = new Error('Connect Tesla for this FleetOS user before syncing telemetry.');
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

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Tesla request failed with ${response.status}`);
  }
  return response.json();
}

export async function disconnectTesla(req, res) {
  const session = await getSession(req, res);
  if (!session) return false;
  await query(
    `update fleetos_tesla_connections
     set revoked_at = now(), access_token_enc = null, refresh_token_enc = refresh_token_enc, updated_at = now()
     where user_id = $1 and provider = 'tesla'`,
    [session.userId],
  );
  return true;
}
