import pg from 'pg';

const { Pool } = pg;
const globalStore = globalThis.__fleetosRevenueStore || { records: [] };
globalThis.__fleetosRevenueStore = globalStore;
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })
  : null;

async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    create table if not exists beta_revenue_records (
      id text primary key,
      vehicle_key text,
      vehicle_label text,
      record_date date,
      source text,
      amount numeric,
      notes text,
      created_at timestamptz not null default now()
    )
  `);
}

function normalizeRecord(record = {}) {
  return {
    id: record.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleKey: String(record.vehicleKey || record.vin || record.vehicle || ''),
    vehicleLabel: String(record.vehicleLabel || record.vehicle || ''),
    date: record.date || new Date().toISOString().slice(0, 10),
    source: record.source || 'Manual',
    amount: Number(record.amount) || 0,
    notes: record.notes || '',
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

async function listRevenue() {
  if (!pool) return globalStore.records;
  await ensureTable();
  const { rows } = await pool.query('select id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at from beta_revenue_records order by created_at desc limit 1000');
  return rows.map((row) => ({
    id: row.id,
    vehicleKey: row.vehicle_key,
    vehicleLabel: row.vehicle_label,
    date: row.record_date,
    source: row.source,
    amount: Number(row.amount || 0),
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

async function saveRevenue(records) {
  if (!pool) {
    globalStore.records.unshift(...records);
    globalStore.records.splice(1000);
    return globalStore.records;
  }

  await ensureTable();
  await Promise.all(records.map((record) => pool.query(
    `insert into beta_revenue_records (id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       vehicle_key = excluded.vehicle_key,
       vehicle_label = excluded.vehicle_label,
       record_date = excluded.record_date,
       source = excluded.source,
       amount = excluded.amount,
       notes = excluded.notes`,
    [record.id, record.vehicleKey, record.vehicleLabel, record.date, record.source, record.amount, record.notes, record.createdAt],
  )));
  return listRevenue();
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ records: await listRevenue(), postgres: Boolean(pool) });
    return;
  }

  if (req.method === 'DELETE') {
    if (pool) {
      await ensureTable();
      await pool.query('delete from beta_revenue_records');
    } else {
      globalStore.records = [];
    }
    res.status(200).json({ records: [], postgres: Boolean(pool) });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const incoming = Array.isArray(req.body?.records)
    ? req.body.records
    : req.body?.record
      ? [req.body.record]
      : [];

  res.status(201).json({ records: await saveRevenue(incoming.map(normalizeRecord)), postgres: Boolean(pool) });
}
