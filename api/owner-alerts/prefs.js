import { getDefaultFleetForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import {
  alertsEnabledForUser,
  getOwnerAlertPref,
  isWebPushConfigured,
  setOwnerAlertPref,
  vapidPublicKey,
} from '../_lib/ownerAlertNotify.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH');
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

    if (req.method === 'PATCH') {
      if (typeof req.body?.enabled !== 'boolean') {
        res.status(400).json({ error: 'ALERT_PREF_INVALID', message: 'enabled must be true or false.' });
        return;
      }
      const pref = await setOwnerAlertPref(context.session.userId, req.body.enabled);
      res.status(200).json({
        enabled: Boolean(pref.enabled),
        vapidPublicKey: vapidPublicKey() || null,
        pushConfigured: isWebPushConfigured(),
      });
      return;
    }

    const pref = await getOwnerAlertPref(context.session.userId);
    const enabled = pref ? Boolean(pref.enabled) : await alertsEnabledForUser(context.session.userId);
    res.status(200).json({
      enabled,
      stored: Boolean(pref),
      vapidPublicKey: vapidPublicKey() || null,
      pushConfigured: isWebPushConfigured(),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.code || 'OWNER_ALERT_PREFS_UNAVAILABLE',
      message: error.message,
    });
  }
}
