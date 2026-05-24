import { getBillingStatusForSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for billing status.' });
    return;
  }

  try {
    const billing = await getBillingStatusForSession(req, res, { create: false });
    if (!billing) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in to review billing status.' });
      return;
    }

    res.status(200).json({
      ok: true,
      billing,
      policy: {
        label: 'First Tesla free',
        detail: 'FleetOS beta includes one Tesla at no cost. Additional vehicles are marked billable until a paid plan is attached.',
      },
    });
  } catch (error) {
    const status = error.statusCode || error.status || 500;
    res.status(status === 401 ? 401 : 500).json({
      error: status === 401 ? 'LOGIN_REQUIRED' : 'BILLING_STATUS_FAILED',
      message: status === 401 ? 'Sign in to review billing status.' : 'Billing status failed.',
    });
  }
}
