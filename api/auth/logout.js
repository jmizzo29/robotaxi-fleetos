import { clearSessionCookie, getSession, disconnectTesla } from '../_lib/auth.js';
import { hasPostgres, query } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  const session = await getSession(req, res);
  if (session) {
    if (req.body?.disconnectTesla) {
      await disconnectTesla(req, res);
    }
    await query('delete from fleetos_sessions where id = $1', [session.id]);
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
