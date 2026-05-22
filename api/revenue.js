import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

const globalStore = globalThis.__fleetosRevenueStore || { records: [] };
globalThis.__fleetosRevenueStore = globalStore;

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
  if (!hasPostgres()) return globalStore.records;
  await ensureFleetSchema();
  const { rows } = await query('select id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at from fleetos_revenue_records order by created_at desc limit 1000');
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
  if (!hasPostgres()) {
    globalStore.records.unshift(...records);
    globalStore.records.splice(1000);
    return globalStore.records;
  }

  await ensureFleetSchema();
  await Promise.all(records.map((record) => query(
    `insert into fleetos_revenue_records (id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (id) do update set
       vehicle_key = excluded.vehicle_key,
       vehicle_label = excluded.vehicle_label,
       record_date = excluded.record_date,
       source = excluded.source,
       amount = excluded.amount,
       notes = excluded.notes,
       updated_at = now()`,
    [record.id, record.vehicleKey, record.vehicleLabel, record.date, record.source, record.amount, record.notes, record.createdAt],
  )));
  return listRevenue();
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ records: await listRevenue(), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'DELETE') {
    if (hasPostgres()) {
      await ensureFleetSchema();
      await query('delete from fleetos_revenue_records');
    } else {
      globalStore.records = [];
    }
    res.status(200).json({ records: [], postgres: hasPostgres() });
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

  res.status(201).json({ records: await saveRevenue(incoming.map(normalizeRecord)), postgres: hasPostgres() });
}
