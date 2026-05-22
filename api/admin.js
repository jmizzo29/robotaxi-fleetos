import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';
import { redactFeedback, redactLead, requireAdmin } from './_lib/security.js';

function memoryStore() {
  return {
    feedback: [],
    leads: [],
    revenue: [],
  };
}

export default async function handler(req, res) {
  try {
    await requireAdmin(req, res);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.status === 403 ? 'ADMIN_FORBIDDEN' : 'ADMIN_LOGIN_REQUIRED',
      message: error.message,
    });
    return;
  }

  if (!hasPostgres()) {
    const store = memoryStore();
    res.status(200).json({
      postgres: false,
      feedbackCount: store.feedback.length,
      leadCount: store.leads.length,
      revenueRecordCount: store.revenue.length,
      memoryEventCount: 0,
      vehicleCount: 0,
      telemetrySnapshotCount: 0,
      assetRecordCount: 0,
      latestFeedback: store.feedback.slice(0, 10),
      latestLeads: store.leads.slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
    return;
  }

  await ensureFleetSchema();
  const [feedback, leads, revenue, memory, vehicles, telemetry, assets] = await Promise.all([
    query('select id, type, rating, title, detail, route, email, created_at from beta_feedback order by created_at desc limit 10'),
    query('select id, name, email, tesla_count, use_case, plan, created_at from beta_leads order by created_at desc limit 10'),
    query('select count(*)::int as count, coalesce(sum(amount), 0)::float as total from fleetos_revenue_records'),
    query('select count(*)::int as count from fleetos_memory_events'),
    query('select count(*)::int as count from fleetos_vehicles'),
    query('select count(*)::int as count from fleetos_telemetry_snapshots'),
    query('select count(*)::int as count from fleetos_vehicle_assets'),
  ]);

  const feedbackCount = await query('select count(*)::int as count from beta_feedback');
  const leadCount = await query('select count(*)::int as count from beta_leads');

  res.status(200).json({
    postgres: true,
    feedbackCount: feedbackCount.rows[0]?.count || 0,
    leadCount: leadCount.rows[0]?.count || 0,
    revenueRecordCount: revenue.rows[0]?.count || 0,
    revenueTotal: revenue.rows[0]?.total || 0,
    memoryEventCount: memory.rows[0]?.count || 0,
    vehicleCount: vehicles.rows[0]?.count || 0,
    telemetrySnapshotCount: telemetry.rows[0]?.count || 0,
    assetRecordCount: assets.rows[0]?.count || 0,
    latestFeedback: feedback.rows.map(redactFeedback),
    latestLeads: leads.rows.map(redactLead),
    generatedAt: new Date().toISOString(),
  });
}
