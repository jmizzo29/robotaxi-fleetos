import pg from 'pg';

const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })
  : null;

async function ensureTables() {
  if (!pool) return;
  await pool.query(`
    create table if not exists beta_feedback (
      id text primary key,
      type text not null default 'feedback',
      rating integer,
      title text not null,
      detail text not null,
      route text,
      email text,
      created_at timestamptz not null default now()
    );
    create table if not exists beta_leads (
      id text primary key,
      name text,
      email text not null,
      tesla_count text,
      use_case text,
      plan text,
      created_at timestamptz not null default now()
    );
    create table if not exists beta_revenue_records (
      id text primary key,
      vehicle_key text,
      vehicle_label text,
      record_date date,
      source text,
      amount numeric,
      notes text,
      created_at timestamptz not null default now()
    );
  `);
}

function memoryStore() {
  return {
    feedback: globalThis.__fleetosFeedbackStore?.feedback || [],
    leads: globalThis.__fleetosLeadStore?.leads || [],
    revenue: globalThis.__fleetosRevenueStore?.records || [],
  };
}

export default async function handler(req, res) {
  if (!pool) {
    const store = memoryStore();
    res.status(200).json({
      postgres: false,
      feedbackCount: store.feedback.length,
      leadCount: store.leads.length,
      revenueRecordCount: store.revenue.length,
      memoryEventCount: globalThis.__fleetosMemoryEvents?.length || 0,
      latestFeedback: store.feedback.slice(0, 10),
      latestLeads: store.leads.slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
    return;
  }

  await ensureTables();
  const [feedback, leads, revenue] = await Promise.all([
    pool.query('select id, type, rating, title, detail, route, email, created_at from beta_feedback order by created_at desc limit 10'),
    pool.query('select id, name, email, tesla_count, use_case, plan, created_at from beta_leads order by created_at desc limit 10'),
    pool.query('select count(*)::int as count, coalesce(sum(amount), 0)::float as total from beta_revenue_records'),
  ]);

  const feedbackCount = await pool.query('select count(*)::int as count from beta_feedback');
  const leadCount = await pool.query('select count(*)::int as count from beta_leads');

  res.status(200).json({
    postgres: true,
    feedbackCount: feedbackCount.rows[0]?.count || 0,
    leadCount: leadCount.rows[0]?.count || 0,
    revenueRecordCount: revenue.rows[0]?.count || 0,
    revenueTotal: revenue.rows[0]?.total || 0,
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
