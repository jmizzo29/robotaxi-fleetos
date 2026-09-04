// src/services/teslaService.js
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { getApiBase, readJsonResponse } from './apiClient';
import { getAuthToken } from './authTokenStore';

const API_BASE = getApiBase();

export async function getTeslaVehicles({ force = false } = {}) {
  if (!API_BASE) {
    console.warn('Tesla backend URL is not configured for this deployment, using simulation only');
    return null;
  }

  let response;
  try {
    const token = await getAuthToken();
    const forceQuery = force ? '&force=1' : '';
    response = await fetch(`${API_BASE}/vehicles?ts=${Date.now()}${forceQuery}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.warn('Could not connect to backend, using simulation only:', error.message);
    return null;
  }

  if (!response.ok) {
    const detail = await readJsonResponse(response);
    const error = new Error(detail.message || `Tesla vehicle sync failed with status ${response.status}.`);
    error.status = response.status;
    error.code = detail.error || (response.status === 402 ? 'BILLING_REQUIRED' : undefined);
    throw error;
  }

  const data = await readJsonResponse(response, { response: [] });
  const vehicles = data.response || data;
  if (Array.isArray(vehicles)) {
    vehicles.syncMeta = {
      cached: Boolean(data.cached),
      warnings: data.warnings || [],
      cacheTtlSeconds: data.cacheTtlSeconds,
    };
  }
  return vehicles;
}

export async function wakeTeslaVehicle(vehicle) {
  const vehicleId = vehicle?.vin || vehicle?.id;

  if (!vehicleId) {
    throw new Error('No Tesla vehicle ID is available to wake.');
  }

  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(vehicleId)}/wake_up`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message = data.warning?.message || data.message || data.error || `Tesla wake request failed with ${response.status}`;
    throw new Error(message);
  }

  return data.response || data;
}

function finiteOrPrevious(current, previous) {
  if (Number.isFinite(Number(current))) return Number(current);
  if (Number.isFinite(Number(previous))) return Number(previous);
  return undefined;
}

/** Map Tesla vehicles onto Command fleet. Never append demo cars or invent demand metrics. */
export function mergeWithSimulation(realVehicles, currentFleet = []) {
  const previousFleet = Array.isArray(currentFleet) ? currentFleet : [];

  if (!realVehicles || realVehicles.length === 0) {
    return previousFleet.filter((vehicle) => vehicle.isReal);
  }

  return realVehicles.map((vehicle) => {
    const previousReal = previousFleet.find((existing) => existing.isReal && existing.vin === vehicle.vin);
    const utilization = finiteOrPrevious(vehicle.utilization, previousReal?.utilization);

    const normalized = {
      ...vehicle,
      id: `tesla-${vehicle.id || vehicle.vin || vehicle.display_name}`,
      vin: vehicle.vin,
      isReal: true,
      name: vehicle.display_name || 'My Real Tesla',
      status: vehicle.status || vehicle.state || 'ONLINE',
      battery: vehicle.charge_state?.battery_level ?? vehicle.battery,
      latitude:
        vehicle.drive_state?.latitude ??
        vehicle.latitude ??
        previousReal?.latitude ??
        null,
      longitude:
        vehicle.drive_state?.longitude ??
        vehicle.longitude ??
        previousReal?.longitude ??
        null,
      targetLat: vehicle.targetLat ?? previousReal?.targetLat ?? null,
      targetLng: vehicle.targetLng ?? previousReal?.targetLng ?? null,
      assignment:
        vehicle.state === 'online'
          ? `Synced Tesla telemetry${vehicle.speed ? `, ${vehicle.speed} mph` : ''}`
          : `Tesla state: ${vehicle.state || 'unknown'}`,
      revenue: vehicle.revenue ?? 0,
      ...(utilization !== undefined ? { utilization } : {}),
      profitability: finiteOrPrevious(vehicle.profitability, previousReal?.profitability),
      anomalyRisk: finiteOrPrevious(vehicle.anomalyRisk, previousReal?.anomalyRisk),
      maintenanceScore: finiteOrPrevious(vehicle.maintenanceScore, previousReal?.maintenanceScore),
      efficiency: finiteOrPrevious(vehicle.efficiency, previousReal?.efficiency),
      passengers: vehicle.passengers ?? previousReal?.passengers ?? 0,
      odometer: vehicle.odometer,
      speed: vehicle.speed,
      heading: vehicle.heading,
      gpsAsOf: vehicle.gpsAsOf,
      chargingState: vehicle.chargingState,
      chargeLimit: vehicle.chargeLimit ?? vehicle.charge_state?.charge_limit_soc,
      softwareVersion: vehicle.softwareVersion,
      locked: vehicle.locked,
      serviceMode: vehicle.serviceMode,
      syncedAt: vehicle.syncedAt,
      color: '#00ff9f',
    };

    return {
      ...normalized,
      ownership: getVehicleOwnership(normalized),
    };
  });
}
