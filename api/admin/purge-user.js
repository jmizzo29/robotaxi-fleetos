import { ensureFleetSchema, hasPostgres, query } from '../_lib/db.js';
import { auditEvent, requireAdmin } from '../_lib/security.js';

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function purgeClerkUser(email) {
  if (!process.env.CLERK_SECRET_KEY) {
    return { skipped: true, reason: 'CLERK_SECRET_KEY not set' };
  }

  const searchUrl = new URL('https://api.clerk.com/v1/users');
  searchUrl.searchParams.set('email_address', email);

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      Accept: 'application/json',
    },
  });
  const payload = await searchResponse.json().catch(() => ({}));
  if (!searchResponse.ok) {
    return {
      skipped: false,
      error: payload?.errors?.[0]?.message || `Clerk search failed with ${searchResponse.status}`,
    };
  }

  const users = Array.isArray(payload) ? payload : payload?.data || [];
  const deleted = [];
  for (const user of users) {
    if (!user?.id) continue;
    const deleteResponse = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        Accept: 'application/json',
      },
    });
    if (deleteResponse.ok) deleted.push(user.id);
  }

  return { skipped: false, deletedCount: deleted.length };
}

async function purgePostgresUser(email) {
  await ensureFleetSchema();
  const userResult = await query('select id, email from fleetos_users where lower(email) = lower($1)', [email]);
  const user = userResult.rows[0] || null;

  await query('delete from beta_leads where lower(email) = lower($1)', [email]).catch(() => {});
  await query('delete from beta_feedback where lower(email) = lower($1)', [email]).catch(() => {});

  if (!user) {
    return {
      found: false,
      deletedUser: false,
      fleetCount: 0,
      teslaConnectionDeleted: false,
    };
  }

  const userId = user.id;
  const fleets = await query('select id from fleetos_fleets where owner_user_id = $1', [userId]);
  const fleetIds = fleets.rows.map((row) => row.id);
  const teslaConnections = await query('select count(*)::int as count from fleetos_tesla_connections where user_id = $1', [userId]);

  if (fleetIds.length > 0) {
    await query(
      `delete from fleetos_telemetry_snapshots
       where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))`,
      [fleetIds],
    );
    await query('delete from fleetos_memory_events where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_revenue_records where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_vehicle_assets where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_earnings_estimates where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_maintenance_logs where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))', [fleetIds]);
    await query('delete from fleetos_vehicles where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_fleet_members where fleet_id = any($1::text[])', [fleetIds]);
    await query('delete from fleetos_fleets where id = any($1::text[])', [fleetIds]);
  }

  await query('delete from fleetos_oauth_states where session_id in (select id from fleetos_sessions where user_id = $1)', [userId]);
  await query('delete from fleetos_magic_links where user_id = $1 or lower(email) = lower($2)', [userId, email]);
  await query('delete from fleetos_billing_entitlements where user_id = $1', [userId]);
  await query('delete from fleetos_tesla_connections where user_id = $1', [userId]);
  await query('delete from fleetos_sessions where user_id = $1', [userId]);
  await query('delete from fleetos_users where id = $1', [userId]);

  return {
    found: true,
    deletedUser: true,
    userId,
    fleetCount: fleetIds.length,
    teslaConnectionDeleted: Number(teslaConnections.rows[0]?.count || 0) > 0,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  let adminSession = null;
  let recoveryAdmin = false;
  try {
    adminSession = await requireAdmin(req, res);
  } catch (error) {
    const resetToken = String(req.body?.resetToken || '');
    const expectedResetToken = String(process.env.ADMIN_RESET_TOKEN || process.env.FLEETOS_ADMIN_RESET_TOKEN || '');
    if (!expectedResetToken || resetToken !== expectedResetToken) {
      res.status(error.status || 500).json({
        error: error.status === 403 ? 'ADMIN_FORBIDDEN' : 'ADMIN_LOGIN_REQUIRED',
        message: `${error.message} To recover during beta testing, set ADMIN_RESET_TOKEN in Vercel and enter it on the admin page.`,
      });
      return;
    }
    recoveryAdmin = true;
  }

  if (!hasPostgres()) {
    res.status(503).json({ error: 'DATABASE_REQUIRED', message: 'Postgres is required for admin user purge.' });
    return;
  }

  const email = cleanEmail(req.body?.email);
  const confirmation = cleanEmail(req.body?.confirmation);
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'EMAIL_REQUIRED', message: 'Enter the beta user email to purge.' });
    return;
  }

  if (confirmation !== email) {
    res.status(400).json({ error: 'CONFIRMATION_REQUIRED', message: 'Type the same email address to confirm the purge.' });
    return;
  }

  try {
    const postgres = await purgePostgresUser(email);
    const clerk = await purgeClerkUser(email);
    await auditEvent({
      userId: adminSession?.userId || null,
      action: recoveryAdmin ? 'admin_recovery_user_purged' : 'admin_user_purged',
      resource: 'admin',
      metadata: {
        targetEmail: email,
        recoveryAdmin,
        postgres: {
          found: postgres.found,
          fleetCount: postgres.fleetCount,
          teslaConnectionDeleted: postgres.teslaConnectionDeleted,
        },
        clerk: {
          skipped: clerk.skipped,
          deletedCount: clerk.deletedCount || 0,
          error: clerk.error || null,
        },
      },
    }).catch(() => {});

    res.status(200).json({
      ok: true,
      email,
      postgres,
      clerk,
      message: postgres.found
        ? 'User, Tesla sync, and fleet data purge completed.'
        : 'No RoboAgent user row found. Matching beta lead/feedback rows were still cleared if present.',
    });
  } catch (error) {
    res.status(500).json({ error: 'ADMIN_PURGE_FAILED', message: error.message });
  }
}
