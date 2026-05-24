import { createAccount, getSession, validateInviteCode } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for RoboAgent accounts.' });
    return;
  }

  if (!validateInviteCode(req.body?.inviteCode)) {
    res.status(403).json({
      error: 'INVITE_REQUIRED',
      message: 'RoboAgent beta is invite-only. Enter the invite code provided to this tester.',
    });
    return;
  }

  try {
    const existingSession = await getSession(req, res, { create: false });
    const account = await createAccount({
      email: req.body?.email,
      password: req.body?.password,
      name: req.body?.name,
      res,
      existingSession,
    });

    res.status(201).json({
      ok: true,
      authenticated: true,
      user: account.user,
      sessionId: account.session.id,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: 'REGISTER_FAILED',
      message: error.message,
    });
  }
}
