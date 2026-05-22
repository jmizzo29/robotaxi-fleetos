import crypto from 'node:crypto';
import { getTeslaConnectionForSession } from './_lib/auth.js';

function fingerprint(value) {
  return value ? crypto.createHash('sha256').update(value).digest('hex').slice(0, 12) : null;
}

export default async function handler(req, res) {
  const connection = await getTeslaConnectionForSession(req, res).catch(() => null);

  res.status(200).json({
    ok: true,
    teslaConfigured: Boolean(process.env.TESLA_CLIENT_ID && connection?.connection),
    teslaConnected: Boolean(connection?.connection),
    hasClientSecret: Boolean(process.env.TESLA_CLIENT_SECRET),
    hasRedirectUri: Boolean(process.env.TESLA_REDIRECT_URI),
    hasRefreshToken: Boolean(connection?.connection?.refresh_token_enc),
    redirectUri: process.env.TESLA_REDIRECT_URI || '/api/tesla/callback',
    authUrl: 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token',
    fleetApiBase: process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    partnerDomain: process.env.TESLA_PARTNER_DOMAIN || null,
    envFingerprint: {
      clientId: fingerprint(process.env.TESLA_CLIENT_ID),
      refreshToken: connection?.connection ? 'stored-per-user' : null,
      clientIdLength: process.env.TESLA_CLIENT_ID?.length || 0,
      refreshTokenLength: connection?.connection?.refresh_token_enc?.length || 0,
    },
  });
}
