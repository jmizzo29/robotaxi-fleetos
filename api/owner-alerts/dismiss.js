import { getDefaultFleetForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import { recordOwnerAlertSend } from '../_lib/ownerAlertNotify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for owner alerts.' });
    return;
  }

  const vin = String(req.body?.vin || '').trim();
  const trigger = String(req.body?.trigger || '').trim();
  if (!vin || !trigger) {
    res.status(400).json({ error: 'OWNER_ALERT_DISMISS_INVALID', message: 'vin and trigger are required.' });
    return;
  }

  try {
    const context = await getDefaultFleetForSession(req, res, { create: false });
    if (!context?.session?.userId) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to dismiss owner alerts.' });
      return;
    }

    await recordOwnerAlertSend(context.session.userId, { vin, trigger, dismissed: true });
    res.status(200).json({ ok: true, vin, trigger });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.code || 'OWNER_ALERT_DISMISS_UNAVAILABLE',
      message: error.message,
    });
  }
}
