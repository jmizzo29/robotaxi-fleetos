import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

function memoryStore() {
  return {
    feedback: globalThis.__fleetosFeedbackStore?.feedback || [],
    leads: globalThis.__fleetosLeadStore?.leads || [],
    revenue: globalThis.__fleetosRevenueStore?.records || [],
  };
}

export default async function handler(req, res) {
  if (!hasPostgres()) {
    const store = memoryStore();
    res.status(200).json({
      postgres: false,
      feedbackCount: store.feedback.length,
      leadCount: store.leads.length,
      revenueRecordCount: store.revenue.length,
      memoryEventCount: globalThis.__fleetosMemoryEvents?.length || 0,
      vehicleCount: 0,
      telemetrySnapshotCount: 0,
      assetRecordCount: Object.keys(globalThis.__fleetosAssetRecords || {}).length,
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
    latestFeedback: feedback.rows.map((row) => ({
      id: row.id,
      type: row.type,
      rating: row.rating,
      title: row.title,
      detail: row.detail,
      route: row.route,
      email: row.email,
      createdAt: row.created_at,
    })),
    latestLeads: leads.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      teslaCount: row.tesla_count,
      useCase: row.use_case,
      plan: row.plan,
      createdAt: row.created_at,
    })),
    generatedAt: new Date().toISOString(),
  });
}
