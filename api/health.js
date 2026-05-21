export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    teslaConfigured: Boolean(process.env.TESLA_CLIENT_ID && process.env.TESLA_REFRESH_TOKEN),
    hasClientSecret: Boolean(process.env.TESLA_CLIENT_SECRET),
    hasRedirectUri: Boolean(process.env.TESLA_REDIRECT_URI),
    redirectUri: process.env.TESLA_REDIRECT_URI || 'http://localhost:3001/callback',
    fleetApiBase: process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com',
    partnerDomain: process.env.TESLA_PARTNER_DOMAIN || null,
  });
}
