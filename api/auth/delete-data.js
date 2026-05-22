import { deleteCurrentUserData, getSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import { auditEvent } from '../_lib/security.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    res.setHeader('Allow', 'DELETE, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres is required for account deletion.',
    });
    return;
  }

  const session = await getSession(req, res);
  const result = await deleteCurrentUserData(req, res);
  await auditEvent({
    userId: session?.userId || null,
    action: 'user_data_deleted',
    resource: 'account',
    metadata: { deleted: result.deleted, fleetCount: result.fleetCount || 0 },
  }).catch(() => {});
  res.status(200).json({ ok: true, ...result });
}
