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
    res.status(400).send(`
      <html>
        <body style="font-family: system-ui; background: #0b1120; color: white; padding: 32px; line-height: 1.5;">
          <h1>Tesla connection was not started correctly</h1>
          <p>This callback URL must be opened by Tesla after you click Connect Tesla inside RoboAgent.</p>
          <p>Go back to RoboAgent onboarding, sign in, then click Connect Tesla again.</p>
          <p><a style="color: #7dd3fc;" href="/#/onboarding">Return to RoboAgent onboarding</a></p>
        </body>
      </html>
    `);
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
    res.status(400).send(`
      <html>
        <body style="font-family: system-ui; background: #0b1120; color: white; padding: 32px; line-height: 1.5;">
          <h1>Tesla connection expired</h1>
          <p>The Tesla authorization state was invalid or expired. This can happen if the callback URL was opened directly, the browser session changed, or the redirect URI pointed at an old localhost callback.</p>
          <p>Please return to RoboAgent and start Connect Tesla again.</p>
          <p><a style="color: #7dd3fc;" href="/#/onboarding">Return to RoboAgent onboarding</a></p>
        </body>
      </html>
    `);
    return;
  }

  const sessionRows = await query('select user_id from fleetos_sessions where id = $1 and expires_at > now()', [oauthState.session_id]);
  const session = sessionRows.rows[0];
  if (!session) {
    res.status(400).send('RoboAgent session expired before Tesla authorization completed.');
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

  const tokenText = await response.text();
  if (!tokenText) {
    res.status(502).send('Tesla token exchange returned an empty response.');
    return;
  }
  const tokenPayload = JSON.parse(tokenText);
  try {
    await saveTeslaConnection({ userId: session.user_id, tokenPayload });
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }

  res.redirect(oauthState.return_to || '/#/tesla');
}
