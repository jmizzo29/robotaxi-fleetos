import { getDefaultFleetForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import {
  alertsEnabledForUser,
  evaluateStoredOwnerAlert,
  isWebPushConfigured,
  vapidPublicKey,
} from '../_lib/ownerAlertNotify.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for owner alerts.' });
    return;
  }

  try {
    const context = await getDefaultFleetForSession(req, res, { create: false });
    if (!context?.session?.userId || !context?.fleet?.id) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to load owner alerts.' });
      return;
    }

    const enabled = await alertsEnabledForUser(context.session.userId);
    const { alert } = enabled
      ? await evaluateStoredOwnerAlert(context.session.userId, context.fleet.id)
      : { alert: null };

    res.status(200).json({
      enabled,
      alert,
      vapidPublicKey: vapidPublicKey() || null,
      pushConfigured: isWebPushConfigured(),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.code || 'OWNER_ALERT_ACTIVE_UNAVAILABLE',
      message: error.message,
    });
  }
}
