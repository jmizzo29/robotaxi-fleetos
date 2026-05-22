import { consumeMagicLink } from '../../_lib/auth.js';

function appRedirect(req, path = '/#/account') {
  if (req.query?.return_to) return String(req.query.return_to);
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}${path}` : path;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    await consumeMagicLink({ token: req.query?.token, res });
    res.redirect(302, appRedirect(req));
  } catch (error) {
    res.status(error.status || 400).send(error.message || 'Magic link failed.');
  }
}
