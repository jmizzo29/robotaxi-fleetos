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

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ records: globalStore.records });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const incoming = Array.isArray(req.body?.records)
    ? req.body.records
    : req.body?.record
      ? [req.body.record]
      : [];

  globalStore.records.unshift(...incoming.map(normalizeRecord));
  globalStore.records.splice(1000);
  res.status(201).json({ records: globalStore.records });
}
