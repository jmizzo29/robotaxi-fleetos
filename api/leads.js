import pg from 'pg';
import { requireAdmin } from './_lib/security.js';

const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,   // or true if you have proper certs
    },
  })
  : null;

async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    create table if not exists beta_leads (
      id text primary key,
      name text,
      email text not null,
      tesla_count text,
      use_case text,
      plan text,
      created_at timestamptz not null default now()
    )
  `);
}

function normalizeLead(body = {}) {
  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    teslaCount: String(body.teslaCount || '1').trim(),
    useCase: String(body.useCase || 'Owner rental').trim(),
    plan: String(body.plan || 'First Tesla free').trim(),
    createdAt: new Date().toISOString(),
  };
}

async function listLeads() {
  await ensureTable();
  const { rows } = await pool.query('select id, name, email, tesla_count, use_case, plan, created_at from beta_leads order by created_at desc limit 100');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    teslaCount: row.tesla_count,
    useCase: row.use_case,
    plan: row.plan,
    createdAt: row.created_at,
  }));
}

async function saveLead(lead) {
  await ensureTable();
  await pool.query(
    `insert into beta_leads (id, name, email, tesla_count, use_case, plan, created_at)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update set
       name = excluded.name,
       email = excluded.email,
       tesla_count = excluded.tesla_count,
       use_case = excluded.use_case,
       plan = excluded.plan`,
    [lead.id, lead.name, lead.email, lead.teslaCount, lead.useCase, lead.plan, lead.createdAt],
  );
  return lead;
}

export default async function handler(req, res) {
  if (!pool) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres DATABASE_URL is required for early access leads.',
    });
    return;
  }

  if (req.method === 'GET') {
    // Leads contain names and emails — admin only.
    try {
      await requireAdmin(req, res);
    } catch (error) {
      res.status(error.status || 401).json({ error: 'ADMIN_REQUIRED', message: error.message });
      return;
    }
    const leads = await listLeads();
    res.status(200).json({
      count: leads.length,
      leads: leads.slice(0, 25),
      postgres: Boolean(pool),
    });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const lead = normalizeLead(req.body);

  if (!lead.email || !lead.email.includes('@')) {
    res.status(400).json({
      error: 'EMAIL_REQUIRED',
      message: 'Enter a valid email address.',
    });
    return;
  }

  console.log('ROBOAGENT early access lead', {
    email: lead.email,
    teslaCount: lead.teslaCount,
    useCase: lead.useCase,
    plan: lead.plan,
  });

  res.status(201).json({ ok: true, lead: await saveLead(lead), postgres: Boolean(pool) });
}
