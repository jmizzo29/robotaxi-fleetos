import crypto from 'crypto';
import { getSession } from '../_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from '../_lib/db.js';

const TESLA_AUTHORIZE_URL = process.env.TESLA_AUTHORIZE_URL || 'https://auth.tesla.com/oauth2/v3/authorize';
const DEFAULT_SCOPES = process.env.TESLA_SCOPES || 'openid offline_access user_data vehicle_device_data vehicle_location';

function originFromRequest(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function redirectUriFromRequest(req) {
  const configured = process.env.TESLA_REDIRECT_URI || '';
  const origin = originFromRequest(req);
  const isProductionHost = origin.includes('robotaxi-fleetos.vercel.app') || process.env.VERCEL === '1';
  const configuredIsLocal = configured.includes('localhost') || configured.includes('127.0.0.1');

  if (configured && !(isProductionHost && configuredIsLocal)) {
    return configured;
  }

  return `${origin}/api/tesla/callback`;
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
  const session = await getSession(req, res, { create: true });
  if (!session) {
    res.status(401).send('Sign in to FleetOS before connecting Tesla.');
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
