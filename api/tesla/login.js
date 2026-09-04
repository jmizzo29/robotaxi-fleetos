import crypto from 'crypto';
import { getSession } from '../_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from '../_lib/db.js';
import { DEFAULT_USER_SCOPES } from '../_lib/teslaScopes.js';
import { CANONICAL_APP_ORIGIN, resolveTeslaRedirectUri } from '../../src/utils/publicAppOrigins.js';

const TESLA_AUTHORIZE_URL = process.env.TESLA_AUTHORIZE_URL || 'https://auth.tesla.com/oauth2/v3/authorize';
const DEFAULT_SCOPES = process.env.TESLA_SCOPES || DEFAULT_USER_SCOPES;
const DEFAULT_PUBLIC_APP_URL = CANONICAL_APP_ORIGIN;

export function redirectUriFromRequest(_req) {
  const configured = process.env.TESLA_REDIRECT_URI || '';
  const configuredIsLocal = configured.includes('localhost') || configured.includes('127.0.0.1');
  const publicAppUrl = process.env.PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL;
  // Ignore Host, x-forwarded-host, and clientOrigin. Tesla requires one
  // registered callback for every client, including iPhone Safari.
  return resolveTeslaRedirectUri({
    teslaRedirectUri: configuredIsLocal ? '' : configured,
    publicAppUrl,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).send('Postgres DATABASE_URL is required for Tesla OAuth.');
    return;
  }

  if (!process.env.TESLA_CLIENT_ID) {
    res.status(503).send('TESLA_CLIENT_ID is required for Tesla OAuth.');
    return;
  }

  await ensureFleetSchema();
  let session;
  try {
    session = await getSession(req, res, { create: true });
  } catch {
    session = null;
  }

  if (!session?.id) {
    res.status(503).send('Unable to start Tesla connection. Please try again.');
    return;
  }
  const redirectUri = redirectUriFromRequest(req);
  const state = crypto.randomBytes(24).toString('hex');
  const returnTo = String(req.query.returnTo || '/#/tesla');

  await query(
    `insert into fleetos_oauth_states (state, session_id, redirect_uri, return_to, expires_at)
     values ($1, $2, $3, $4, now() + interval '15 minutes')`,
    [state, session.id, redirectUri, returnTo],
  );

  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.TESLA_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', DEFAULT_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt_missing_scopes', 'true');

  res.redirect(url.toString());
}
