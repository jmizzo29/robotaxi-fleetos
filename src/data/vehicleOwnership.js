import { fetchApiJson } from '../services/apiClient';

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

let savedOwnershipRecords = {};
const numericFields = new Set([
  'modelYear',
  'purchaseYear',
  'pricePaid',
  'currentBalance',
  'monthlyPayment',
]);

export function getVehicleOwnershipKey(vehicle) {
  return vehicle?.name || vehicle?.display_name || vehicle?.id || vehicle?.vin;
}

export function readSavedOwnershipRecords() {
  return savedOwnershipRecords;
}

function normalizeOwnershipRecord(record = {}) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      numericFields.has(key) && value !== '' && value !== null ? Number(value) : value,
    ]),
  );
}

function publishOwnership(records) {
  savedOwnershipRecords = records && typeof records === 'object' ? records : {};
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fleetos-ownership-updated', { detail: savedOwnershipRecords }));
  }
  return savedOwnershipRecords;
}

export async function saveVehicleOwnership(key, record) {
  if (!key) return null;

  const normalized = normalizeOwnershipRecord(record);
  const data = await fetchApiJson('/assets', {
    method: 'POST',
    body: JSON.stringify({ key, record: normalized }),
  });

  publishOwnership(data.records || { ...savedOwnershipRecords, [key]: normalized });
  return savedOwnershipRecords[key];
}

export async function resetVehicleOwnership(key) {
  if (!key) return;

  const data = await fetchApiJson(`/assets?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
  publishOwnership(data.records || {});
}

export async function syncSavedOwnershipFromBackend() {
  const data = await fetchApiJson('/assets');
  const records = data.records && typeof data.records === 'object' ? data.records : {};
  return publishOwnership(records);
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
