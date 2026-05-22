import { saveTeslaConnection } from '../_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from '../_lib/db.js';

const TESLA_AUTH_URL = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).send('Method not allowed');
    return;
  }

  if (!hasPostgres()) {
    res.status(503).send('Postgres DATABASE_URL is required for Tesla OAuth.');
    return;
  }

  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  if (!code || !state) {
    res.status(400).send('Tesla authorization callback was missing code/state.');
    return;
  }

  await ensureFleetSchema();
  const { rows } = await query(
    `delete from fleetos_oauth_states
     where state = $1 and expires_at > now()
     returning session_id, redirect_uri, return_to`,
    [state],
  );

  const oauthState = rows[0];
  if (!oauthState) {
    res.status(400).send('Tesla authorization state was invalid or expired.');
    return;
  }

  const sessionRows = await query('select user_id from fleetos_sessions where id = $1 and expires_at > now()', [oauthState.session_id]);
  const session = sessionRows.rows[0];
  if (!session) {
    res.status(400).send('FleetOS session expired before Tesla authorization completed.');
    return;
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.TESLA_CLIENT_ID,
    code,
    redirect_uri: oauthState.redirect_uri,
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
    res.status(502).send(`Tesla token exchange failed: ${detail || response.status}`);
    return;
  }

  const tokenPayload = await response.json();
  try {
    await saveTeslaConnection({ userId: session.user_id, tokenPayload });
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }

  res.redirect(oauthState.return_to || '/#/tesla');
}
