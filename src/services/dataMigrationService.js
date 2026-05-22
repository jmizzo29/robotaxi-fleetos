import { readSavedOwnershipRecords } from '../data/vehicleOwnership';
import { getApiBase } from './apiClient';
import { readFleetMemory } from './fleetMemory';
import { readRevenueRecords } from './revenueService';

const SESSION_KEY = 'fleetos.postgresMigrationAttempted.v1';

async function postJson(path, body) {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
}

export async function migrateLocalFleetDataToPostgres() {
  if (typeof window === 'undefined' || window.sessionStorage.getItem(SESSION_KEY) === '1') {
    return { skipped: true };
  }

  window.sessionStorage.setItem(SESSION_KEY, '1');

  const ownershipRecords = readSavedOwnershipRecords();
  const memoryEvents = readFleetMemory();
  const revenueRecords = readRevenueRecords();

  const assetResults = await Promise.allSettled(
    Object.entries(ownershipRecords).map(([key, record]) => postJson('/assets', { key, record })),
  );

  const [memoryResult, revenueResult] = await Promise.allSettled([
    memoryEvents.length ? postJson('/memory', { events: memoryEvents }) : Promise.resolve(true),
    revenueRecords.length ? postJson('/revenue', { records: revenueRecords }) : Promise.resolve(true),
  ]);

  return {
    assets: assetResults.filter((result) => result.status === 'fulfilled' && result.value).length,
    memory: memoryResult.status === 'fulfilled' && memoryResult.value ? memoryEvents.length : 0,
    revenue: revenueResult.status === 'fulfilled' && revenueResult.value ? revenueRecords.length : 0,
  };
}
