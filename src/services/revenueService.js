import { getApiBase } from './apiClient';

const API_BASE = getApiBase();
let revenueCache = [];

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
  return revenueCache;
}

export function writeRevenueRecords(records) {
  const normalized = records.map(normalizeRecord).slice(0, 1000);
  revenueCache = normalized;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fleetos-revenue-updated', { detail: normalized }));
  }
  return normalized;
}

async function postRevenue(payload) {
  const response = await fetch(`${API_BASE}/revenue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Revenue save failed with ${response.status}`);
  }
  return Array.isArray(data.records) ? data.records.map(normalizeRecord) : [];
}

export async function addRevenueRecord(record) {
  const normalized = normalizeRecord(record);
  const records = await postRevenue({ record: normalized });
  return writeRevenueRecords(records);
}

export async function importRevenueRecords(records) {
  const normalized = records.map(normalizeRecord).filter((record) => record.amount !== 0);
  const saved = await postRevenue({ records: normalized });
  return writeRevenueRecords(saved);
}

export async function syncRevenueFromBackend() {
  const response = await fetch(`${API_BASE}/revenue`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Revenue load failed with ${response.status}`);
  }
  const records = Array.isArray(data.records) ? data.records : [];
  return writeRevenueRecords(records);
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
