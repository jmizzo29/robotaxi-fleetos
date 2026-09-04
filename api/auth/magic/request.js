import { createMagicLink } from '../../_lib/auth.js';
import { hasPostgres } from '../../_lib/db.js';

function apiOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}` : process.env.PUBLIC_APP_URL;
}

function appOrigin(req) {
  return req.headers.origin || process.env.PUBLIC_APP_URL || apiOrigin(req);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for magic links.' });
    return;
  }

  try {
    const magic = await createMagicLink({
      email: req.body?.email,
      origin: apiOrigin(req),
    });
    const magicUrl = new URL(magic.magicLink);
    magicUrl.searchParams.set('return_to', `${appOrigin(req).replace(/\/$/, '')}/#/account`);
    res.status(200).json({
      ok: true,
      message: 'ROBOAGENT magic link generated. Email delivery is not connected yet, so use this beta link directly.',
      magicLink: magicUrl.toString(),
      expiresInMinutes: magic.expiresInMinutes,
      emailDelivery: 'manual_beta',
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: 'MAGIC_LINK_FAILED',
      message: error.message,
    });
  }
}
