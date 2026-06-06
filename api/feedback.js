import pg from 'pg';

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
    create table if not exists beta_feedback (
      id text primary key,
      type text not null default 'feedback',
      rating integer,
      title text not null,
      detail text not null,
      route text,
      email text,
      created_at timestamptz not null default now()
    )
  `);
}

function normalizeFeedback(body = {}) {
  return {
    id: body.id || `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(body.type || 'feedback').trim(),
    rating: body.rating === '' || body.rating === undefined ? null : Number(body.rating),
    title: String(body.title || '').trim(),
    detail: String(body.detail || '').trim(),
    route: String(body.route || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    createdAt: body.createdAt || new Date().toISOString(),
  };
}

async function listFeedback() {
  await ensureTable();
  const { rows } = await pool.query('select id, type, rating, title, detail, route, email, created_at from beta_feedback order by created_at desc limit 100');
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    rating: row.rating,
    title: row.title,
    detail: row.detail,
    route: row.route,
    email: row.email,
    createdAt: row.created_at,
  }));
}

async function saveFeedback(record) {
  await ensureTable();
  await pool.query(
    `insert into beta_feedback (id, type, rating, title, detail, route, email, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       type = excluded.type,
       rating = excluded.rating,
       title = excluded.title,
       detail = excluded.detail,
       route = excluded.route,
       email = excluded.email`,
    [record.id, record.type, record.rating, record.title, record.detail, record.route, record.email, record.createdAt],
  );
  return record;
}

export default async function handler(req, res) {
  if (!pool) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres DATABASE_URL is required for beta feedback.',
    });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ feedback: await listFeedback(), postgres: Boolean(pool) });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const record = normalizeFeedback(req.body);
  if (!record.title || !record.detail) {
    res.status(400).json({ error: 'FEEDBACK_REQUIRED', message: 'Title and detail are required.' });
    return;
  }

  res.status(201).json({ ok: true, feedback: await saveFeedback(record), postgres: Boolean(pool) });
}
