import crypto from 'node:crypto';
import { getTeslaConnectionForSession } from './_lib/auth.js';
import { isClerkAuthConfigured, isClerkAuthRequired } from './_lib/clerkAuth.js';
import { redirectUriFromRequest } from './tesla/login.js';

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
    redirectUri: redirectUriFromRequest(req),
    authUrl: 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token',
    fleetApiBase: process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    partnerDomain: process.env.TESLA_PARTNER_DOMAIN || null,
    auth: {
      provider: process.env.AUTH_PROVIDER || 'native',
      clerkConfigured: isClerkAuthConfigured(),
      clerkRequired: isClerkAuthRequired(),
      hasClerkPublishableKey: Boolean(process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY),
      hasClerkSecretKey: Boolean(process.env.CLERK_SECRET_KEY),
    },
    envFingerprint: {
      clientId: fingerprint(process.env.TESLA_CLIENT_ID),
      clerkPublishableKey: fingerprint(process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY),
      refreshToken: connection?.connection ? 'stored-per-user' : null,
      clientIdLength: process.env.TESLA_CLIENT_ID?.length || 0,
      refreshTokenLength: connection?.connection?.refresh_token_enc?.length || 0,
    },
  });
}
