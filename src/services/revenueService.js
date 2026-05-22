const STORAGE_KEY = 'fleetos.revenueRecords.v1';

function resolveApiBase() {
  const configuredBase = import.meta.env.VITE_TESLA_API_BASE;
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  if (configuredBase && !configuredBase.includes('localhost') && !configuredBase.includes('127.0.0.1')) {
    return configuredBase;
  }

  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

const API_BASE = resolveApiBase();

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function vehicleKey(vehicle) {
  return vehicle?.vin || vehicle?.id || vehicle?.name || vehicle?.display_name || 'unknown';
}

function normalizeRecord(record = {}) {
  return {
    id: record.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vehicleKey: record.vehicleKey || record.vin || record.vehicle || '',
    vehicleLabel: record.vehicleLabel || record.vehicle || '',
    date: record.date || new Date().toISOString().slice(0, 10),
    source: record.source || 'Manual',
    amount: Number(record.amount) || 0,
    notes: record.notes || '',
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

export function readRevenueRecords() {
  if (!canUseStorage()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeRecord) : [];
  } catch {
    return [];
  }
}

export function writeRevenueRecords(records) {
  if (!canUseStorage()) return [];

  const normalized = records.map(normalizeRecord).slice(0, 1000);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('fleetos-revenue-updated', { detail: normalized }));
  return normalized;
}

export function addRevenueRecord(record) {
  const normalized = normalizeRecord(record);
  const next = [normalized, ...readRevenueRecords()];
  fetch(`${API_BASE}/revenue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: normalized }),
  }).catch(() => {});
  return writeRevenueRecords(next);
}

export function importRevenueRecords(records) {
  const normalized = records.map(normalizeRecord).filter((record) => record.amount !== 0);
  const next = [...normalized, ...readRevenueRecords()];
  fetch(`${API_BASE}/revenue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: normalized }),
  }).catch(() => {});
  return writeRevenueRecords(next);
}

export async function syncRevenueFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/revenue`, { cache: 'no-store' });
    if (!response.ok) return readRevenueRecords();
    const data = await response.json();
    const records = Array.isArray(data.records) ? data.records : [];
    const merged = [...records, ...readRevenueRecords()]
      .map(normalizeRecord)
      .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index);
    return writeRevenueRecords(merged);
  } catch {
    return readRevenueRecords();
  }
}

export function revenueForVehicle(vehicle, records = readRevenueRecords()) {
  const keys = new Set([
    vehicleKey(vehicle),
    vehicle?.vin,
    vehicle?.id,
    vehicle?.name,
    vehicle?.display_name,
  ].filter(Boolean));

  return records
    .filter((record) => keys.has(record.vehicleKey) || keys.has(record.vehicleLabel))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

export function parseRevenueCsv(text = '') {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    const vehicle = row.vin || row.vehiclekey || row.vehicle || row.car || row.name || '';
    return normalizeRecord({
      vehicleKey: vehicle,
      vehicleLabel: row.vehicle || row.car || row.name || vehicle,
      date: row.date || row.start || row.created || undefined,
      source: row.source || row.platform || 'CSV',
      amount: row.amount || row.revenue || row.earnings || row.total || 0,
      notes: row.notes || row.description || '',
    });
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}
