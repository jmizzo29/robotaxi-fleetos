import { fetchApiJson } from './apiClient';
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
  const data = await fetchApiJson('/revenue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
  const data = await fetchApiJson('/revenue');
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

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
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

export function parseTuroCsv(text = '') {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return {
      records: [],
      summary: {
        trips: 0,
        reservations: 0,
        earnings: 0,
        bookedDays: 0,
        utilizationDays: 0,
        vehicles: 0,
      },
    };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const records = [];
  const reservationIds = new Set();
  const vehicles = new Set();
  let bookedDays = 0;

  lines.slice(1).forEach((line, index) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || '']));
    const tripId = pick(row, ['reservationid', 'reservation', 'tripid', 'trip', 'bookingid', 'booking']);
    const vin = pick(row, ['vin', 'vehiclevin', 'vehicleid']);
    const vehicle = pick(row, ['vehicle', 'car', 'listing', 'vehiclelisting', 'name']);
    const startDate = parseFlexibleDate(pick(row, ['startdate', 'tripstart', 'start', 'pickup', 'reservationstart', 'bookedfrom']));
    const endDate = parseFlexibleDate(pick(row, ['enddate', 'tripend', 'end', 'return', 'reservationend', 'bookeduntil']));
    const date = startDate || parseFlexibleDate(pick(row, ['date', 'created', 'transactiondate', 'payoutdate']));
    const amount = parseMoney(pick(row, [
      'earnings',
      'hostearnings',
      'netearnings',
      'totalearnings',
      'payout',
      'amount',
      'net',
      'revenue',
      'total',
    ]));
    const days = calculateBookedDays(startDate, endDate);
    const vehicleKey = vin || vehicle || `turo-row-${index + 1}`;

    if (tripId) reservationIds.add(tripId);
    if (vehicleKey) vehicles.add(vehicleKey);
    bookedDays += days;

    records.push(normalizeRecord({
      id: `turo-${tripId || index + 1}-${date || new Date().toISOString().slice(0, 10)}`,
      vehicleKey,
      vehicleLabel: vehicle || vin || vehicleKey,
      date: date || new Date().toISOString().slice(0, 10),
      source: 'Turo CSV',
      amount,
      notes: [
        tripId ? `Reservation ${tripId}` : null,
        days ? `${days} booked day${days === 1 ? '' : 's'}` : null,
        pick(row, ['status', 'tripstatus']) ? `Status: ${pick(row, ['status', 'tripstatus'])}` : null,
      ].filter(Boolean).join(' | '),
    }));
  });

  const datedRecords = records
    .map((record) => parseFlexibleDate(record.date))
    .filter(Boolean)
    .sort();
  const firstDate = datedRecords[0];
  const lastDate = datedRecords[datedRecords.length - 1];
  const utilizationDays = firstDate && lastDate
    ? Math.max(1, calculateBookedDays(firstDate, lastDate))
    : 0;

  return {
    records: records.filter((record) => record.amount !== 0),
    summary: {
      trips: records.length,
      reservations: reservationIds.size || records.length,
      earnings: records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
      bookedDays,
      utilizationDays,
      utilization: utilizationDays ? Math.min(100, Math.round((bookedDays / (utilizationDays * Math.max(vehicles.size, 1))) * 100)) : null,
      vehicles: vehicles.size,
      firstDate,
      lastDate,
    },
  };
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
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

function normalizeHeader(header = '') {
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pick(row, names) {
  return names.map((name) => row[name]).find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  return Number(normalized) || 0;
}

function parseFlexibleDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function calculateBookedDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.max(1, Math.ceil((end - start) / 86400000));
}
