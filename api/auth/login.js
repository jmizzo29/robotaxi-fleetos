import { createSessionForUser, findUserByEmail, verifyPassword } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for FleetOS login.' });
    return;
  }

  const user = await findUserByEmail(req.body?.email);
  const valid = user?.password_hash ? await verifyPassword(req.body?.password, user.password_hash) : false;

  if (!user || !valid) {
    res.status(401).json({
      error: 'INVALID_LOGIN',
      message: 'Email or password did not match a FleetOS account.',
    });
    return;
  }

  const session = await createSessionForUser(user.id, res);
  res.status(200).json({
    ok: true,
    authenticated: true,
    sessionId: session.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.email_verified_at,
    },
  });
}
