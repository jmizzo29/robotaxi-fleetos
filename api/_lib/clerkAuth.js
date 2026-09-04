import { createClerkClient } from '@clerk/backend';
import { ALLOWED_APP_ORIGINS } from '../../src/utils/publicAppOrigins.js';
import { ensureFleetSchema, query } from './db.js';

function publicClerkKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || '';
}

export function isClerkAuthConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY && publicClerkKey());
}

export function isClerkAuthRequired() {
  return process.env.AUTH_PROVIDER === 'clerk' || process.env.REQUIRE_CLERK_AUTH === 'true';
}

function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3001';
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function authorizedParties(req) {
  const configured = String(process.env.CLERK_AUTHORIZED_PARTIES || process.env.PUBLIC_APP_URL || '')
    .split(',')
    .map((party) => party.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...configured,
      requestOrigin(req),
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...ALLOWED_APP_ORIGINS,
    ]),
  ];
}

function toWebRequest(req) {
  const headers = new Headers();
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  });

  return new Request(`${requestOrigin(req)}${req.url || req.originalUrl || '/'}`, {
    method: req.method || 'GET',
    headers,
  });
}

function emailFromUser(user) {
  const primary = user?.emailAddresses?.find((email) => email.id === user.primaryEmailAddressId);
  return primary?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
}

async function getClerkEmail(client, auth) {
  const claims = auth.sessionClaims || {};
  if (claims.email) return String(claims.email).toLowerCase();
  if (claims.primary_email_address) return String(claims.primary_email_address).toLowerCase();

  const user = await client.users.getUser(auth.userId);
  return emailFromUser(user)?.toLowerCase() || null;
}

export async function getVerifiedClerkSession(req) {
  if (!isClerkAuthConfigured()) return null;

  const client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: publicClerkKey(),
  });

  const requestState = await client.authenticateRequest(toWebRequest(req), {
    authorizedParties: authorizedParties(req),
  });

  if (!requestState.isAuthenticated) {
    if (isClerkAuthRequired()) {
      const error = new Error(requestState.message || 'Sign in with Clerk to continue.');
      error.status = 401;
      throw error;
    }
    return null;
  }

  const auth = requestState.toAuth();
  if (!auth.userId) return null;

  await ensureFleetSchema();
  const email = await getClerkEmail(client, auth);
  const existing = email
    ? await query('select id from fleetos_users where email = $1 limit 1', [email])
    : { rows: [] };
  const userId = existing.rows[0]?.id || `clerk:${auth.userId}`;
  const sessionId = `clerk:${auth.sessionId || auth.userId}`;

  await query(
    `insert into fleetos_users (
      id, email, name, role, auth_provider, external_auth_provider, external_auth_id, email_verified_at, updated_at
    ) values ($1, $2, null, 'owner', 'clerk', 'clerk', $3, now(), now())
    on conflict (id) do update set
      email = coalesce(excluded.email, fleetos_users.email),
      auth_provider = 'clerk',
      external_auth_provider = 'clerk',
      external_auth_id = excluded.external_auth_id,
      email_verified_at = coalesce(fleetos_users.email_verified_at, excluded.email_verified_at),
      updated_at = now()`,
    [userId, email, auth.userId],
  );

  await query(
    `insert into fleetos_sessions (id, user_id, expires_at, last_seen_at)
     values ($1, $2, now() + interval '30 days', now())
     on conflict (id) do update set last_seen_at = now(), expires_at = now() + interval '30 days'`,
    [sessionId, userId],
  );

  return {
    id: sessionId,
    userId,
    authProvider: 'clerk',
    user: {
      id: userId,
      email,
      name: null,
      role: 'owner',
      externalAuthId: auth.userId,
      authProvider: 'clerk',
    },
  };
}
