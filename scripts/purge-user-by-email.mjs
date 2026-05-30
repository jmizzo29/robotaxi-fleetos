import { Pool } from 'pg';

const email = process.argv.find((arg) => arg.startsWith('--email='))?.slice('--email='.length)?.trim().toLowerCase();
const confirmed = process.argv.includes('--confirm');

if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/purge-user-by-email.mjs --email=user@example.com --confirm');
  process.exit(1);
}

if (!confirmed) {
  console.error('Refusing to purge without --confirm.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function purgePostgresUser(client, targetEmail) {
  const userResult = await client.query('select id, email from fleetos_users where lower(email) = lower($1)', [targetEmail]);
  if (!userResult.rows.length) {
    return { found: false, fleetCount: 0 };
  }

  const userId = userResult.rows[0].id;
  const fleets = await client.query('select id from fleetos_fleets where owner_user_id = $1', [userId]);
  const fleetIds = fleets.rows.map((row) => row.id);

  if (fleetIds.length > 0) {
    await client.query(
      `delete from fleetos_telemetry_snapshots
       where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))`,
      [fleetIds],
    );
    await client.query('delete from fleetos_memory_events where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_revenue_records where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_vehicle_assets where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_earnings_estimates where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_maintenance_logs where vehicle_id in (select id from fleetos_vehicles where fleet_id = any($1::text[]))', [fleetIds]);
    await client.query('delete from fleetos_vehicles where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_fleet_members where fleet_id = any($1::text[])', [fleetIds]);
    await client.query('delete from fleetos_fleets where id = any($1::text[])', [fleetIds]);
  }

  await client.query('delete from fleetos_oauth_states where session_id in (select id from fleetos_sessions where user_id = $1)', [userId]);
  await client.query('delete from fleetos_magic_links where user_id = $1 or lower(email) = lower($2)', [userId, targetEmail]);
  await client.query('delete from fleetos_billing_entitlements where user_id = $1', [userId]);
  await client.query('delete from fleetos_tesla_connections where user_id = $1', [userId]);
  await client.query('delete from fleetos_sessions where user_id = $1', [userId]);
  await client.query('delete from fleetos_users where id = $1', [userId]);

  return { found: true, userId, fleetCount: fleetIds.length };
}

async function purgeClerkUser(targetEmail) {
  if (!process.env.CLERK_SECRET_KEY) {
    return { skipped: true, reason: 'CLERK_SECRET_KEY not set' };
  }

  const searchUrl = new URL('https://api.clerk.com/v1/users');
  searchUrl.searchParams.set('email_address', targetEmail);

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      Accept: 'application/json',
    },
  });
  const users = await searchResponse.json().catch(() => []);
  if (!searchResponse.ok) {
    return { skipped: false, error: users?.errors?.[0]?.message || `Clerk search failed with ${searchResponse.status}` };
  }

  const matches = Array.isArray(users) ? users : users?.data || [];
  const deleted = [];
  for (const user of matches) {
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

  return { skipped: false, deleted };
}

const client = await pool.connect();
try {
  await client.query('begin');
  const postgres = await purgePostgresUser(client, email);
  await client.query('commit');
  const clerk = await purgeClerkUser(email);
  console.log(JSON.stringify({ ok: true, email, postgres, clerk }, null, 2));
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.error(JSON.stringify({ ok: false, email, error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
