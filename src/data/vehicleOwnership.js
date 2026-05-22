import { getApiBase } from '../services/apiClient';

const vehicleOwnership = {
  OCE: {
    model: 'Tesla Model X',
    modelYear: 2016,
    trim: 'Performance',
    color: 'Pearl White Multi-Coat',
    tag: 'OCE',
    purchaseDate: '2024-09-18',
    purchaseYear: 2024,
    pricePaid: 46900,
    currentBalance: 31240,
    lender: 'Tesla Finance',
    monthlyPayment: 742,
    insuranceRenewal: '2026-08-01',
    registrationState: 'FL',
  },
  'CAR-001': {
    model: 'FleetOS Sedan',
    modelYear: 2025,
    trim: 'Autonomy Package',
    color: 'Graphite',
    tag: 'FL-001',
    purchaseDate: '2025-01-14',
    purchaseYear: 2025,
    pricePaid: 38500,
    currentBalance: 21400,
    lender: 'Fleet Capital',
    monthlyPayment: 612,
    insuranceRenewal: '2026-05-30',
    registrationState: 'FL',
  },
  'CAR-002': {
    model: 'FleetOS Crossover',
    modelYear: 2025,
    trim: 'Airport Duty',
    color: 'Silver',
    tag: 'FL-002',
    purchaseDate: '2025-02-02',
    purchaseYear: 2025,
    pricePaid: 42100,
    currentBalance: 23950,
    lender: 'Fleet Capital',
    monthlyPayment: 641,
    insuranceRenewal: '2026-06-15',
    registrationState: 'FL',
  },
  'CAR-003': {
    model: 'FleetOS Sedan',
    modelYear: 2024,
    trim: 'Urban Duty',
    color: 'Midnight Blue',
    tag: 'FL-003',
    purchaseDate: '2024-12-10',
    purchaseYear: 2024,
    pricePaid: 37400,
    currentBalance: 19825,
    lender: 'Fleet Capital',
    monthlyPayment: 588,
    insuranceRenewal: '2026-04-20',
    registrationState: 'FL',
  },
  'CAR-004': {
    model: 'FleetOS Crossover',
    modelYear: 2025,
    trim: 'Premium Route',
    color: 'Deep Black',
    tag: 'FL-004',
    purchaseDate: '2025-03-22',
    purchaseYear: 2025,
    pricePaid: 44800,
    currentBalance: 27120,
    lender: 'Fleet Capital',
    monthlyPayment: 679,
    insuranceRenewal: '2026-07-10',
    registrationState: 'FL',
  },
};

const OWNERSHIP_STORAGE_KEY = 'fleetos.assetRecords.v1';
const numericFields = new Set([
  'modelYear',
  'purchaseYear',
  'pricePaid',
  'currentBalance',
  'monthlyPayment',
]);

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

const API_BASE = getApiBase();

export function getVehicleOwnershipKey(vehicle) {
  return vehicle?.name || vehicle?.display_name || vehicle?.id || vehicle?.vin;
}

export function readSavedOwnershipRecords() {
  if (!canUseStorage()) return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(OWNERSHIP_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeOwnershipRecord(record = {}) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      numericFields.has(key) && value !== '' && value !== null ? Number(value) : value,
    ]),
  );
}

export function saveVehicleOwnership(key, record) {
  if (!canUseStorage() || !key) return null;

  const current = readSavedOwnershipRecords();
  const next = {
    ...current,
    [key]: normalizeOwnershipRecord(record),
  };

  window.localStorage.setItem(OWNERSHIP_STORAGE_KEY, JSON.stringify(next));
  fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, record: next[key] }),
  }).catch(() => {});
  window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: next }));
  return next[key];
}

export function resetVehicleOwnership(key) {
  if (!canUseStorage() || !key) return;

  const current = readSavedOwnershipRecords();
  delete current[key];
  window.localStorage.setItem(OWNERSHIP_STORAGE_KEY, JSON.stringify(current));
  fetch(`${API_BASE}/assets?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => {});
  window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: current }));
}

export async function syncSavedOwnershipFromBackend() {
  if (!canUseStorage()) return {};

  try {
    const response = await fetch(`${API_BASE}/assets`, { cache: 'no-store' });
    if (!response.ok) return readSavedOwnershipRecords();

    const data = await response.json();
    const records = data.records && typeof data.records === 'object' ? data.records : {};
    const merged = {
      ...records,
      ...readSavedOwnershipRecords(),
    };
    window.localStorage.setItem(OWNERSHIP_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: merged }));
    return merged;
  } catch {
    return readSavedOwnershipRecords();
  }
}

export function getVehicleOwnership(vehicle) {
  const key = getVehicleOwnershipKey(vehicle);
  const saved = readSavedOwnershipRecords();
  const base = vehicleOwnership[key] || vehicleOwnership[vehicle?.id] || {};
  const override = saved[key] || saved[vehicle?.id] || {};
  const merged = { ...base, ...override };
  return Object.keys(merged).length ? merged : null;
}

export default vehicleOwnership;
