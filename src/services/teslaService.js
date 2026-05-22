// src/services/teslaService.js
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { getApiBase } from './apiClient';

const API_BASE = getApiBase();
const PARKED_TESLA_ANCHOR = {
  latitude: 28.62,
  longitude: -81.22,
};

export async function getTeslaVehicles() {
  if (!API_BASE) {
    console.warn('Tesla backend URL is not configured for this deployment, using simulation only');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/vehicles?ts=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      console.warn('Backend returned an error, using simulation only:', detail.message || response.status);
      return null;
    }

    const data = await response.json();
    return data.response || data;
  } catch (error) {
    console.warn('Could not connect to backend, using simulation only:', error.message);
    return null;
  }
}

export async function wakeTeslaVehicle(vehicle) {
  const vehicleId = vehicle?.vin || vehicle?.id;

  if (!vehicleId) {
    throw new Error('No Tesla vehicle ID is available to wake.');
  }

  const response = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(vehicleId)}/wake_up`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Tesla wake request failed with ${response.status}`);
  }

  return data.response || data;
}

export function mergeWithSimulation(realVehicles, simulatedVehicles) {
  if (!realVehicles || realVehicles.length === 0) {
    return simulatedVehicles;
  }

  const simulatedOnly = simulatedVehicles.filter((vehicle) => !vehicle.isReal);
  const realMarked = realVehicles.map((vehicle, index) => {
    const previousReal = simulatedVehicles.find((existing) => existing.isReal && existing.vin === vehicle.vin);

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
        PARKED_TESLA_ANCHOR.latitude + index * 0.018,
      longitude:
        vehicle.drive_state?.longitude ??
        vehicle.longitude ??
        previousReal?.longitude ??
        PARKED_TESLA_ANCHOR.longitude - index * 0.018,
      targetLat: vehicle.targetLat ?? 28.4312,
      targetLng: vehicle.targetLng ?? -81.3081,
      assignment:
        vehicle.state === 'online'
          ? `Synced Tesla telemetry${vehicle.speed ? `, ${vehicle.speed} mph` : ''}`
          : `Tesla state: ${vehicle.state || 'unknown'}`,
      revenue: vehicle.revenue ?? 0,
      utilization: vehicle.utilization ?? 72,
      profitability: vehicle.profitability ?? 86,
      anomalyRisk: vehicle.anomalyRisk ?? 4,
      maintenanceScore: vehicle.maintenanceScore ?? 92,
      efficiency: vehicle.efficiency ?? 96,
      passengers: vehicle.passengers ?? 0,
      odometer: vehicle.odometer,
      speed: vehicle.speed,
      heading: vehicle.heading,
      gpsAsOf: vehicle.gpsAsOf,
      chargingState: vehicle.chargingState,
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

  return [...realMarked, ...simulatedOnly].slice(0, Math.max(10, realMarked.length));
}
