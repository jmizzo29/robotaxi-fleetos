import { getSession, updateCurrentUserProfile } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for profiles.' });
    return;
  }

  if (req.method === 'GET') {
    const session = await getSession(req, res);
    res.status(200).json({ authenticated: Boolean(session), user: session?.user || null });
    return;
  }

  const user = await updateCurrentUserProfile(req, res, req.body || {});
  if (!user) {
    res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in before updating your profile.' });
    return;
  }

  res.status(200).json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.email_verified_at,
    },
  });
}
