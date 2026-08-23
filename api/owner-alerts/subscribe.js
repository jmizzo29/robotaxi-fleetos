import { getDefaultFleetForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import {
  deletePushSubscription,
  savePushSubscription,
  setOwnerAlertPref,
} from '../_lib/ownerAlertNotify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for owner alerts.' });
    return;
  }

  try {
    const context = await getDefaultFleetForSession(req, res, { create: false });
    if (!context?.session?.userId) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to manage owner alerts.' });
      return;
    }

    if (req.method === 'DELETE') {
      await deletePushSubscription(context.session.userId, req.body?.endpoint);
      res.status(200).json({ ok: true });
      return;
    }

    const saved = await savePushSubscription(context.session.userId, req.body || {});
    await setOwnerAlertPref(context.session.userId, true);
    res.status(200).json({ ok: true, endpoint: saved.endpoint, enabled: true });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.code || 'OWNER_ALERT_SUBSCRIBE_UNAVAILABLE',
      message: error.message,
    });
  }
}
