// src/services/teslaService.js
const API_BASE = 'http://localhost:3001/api';

export async function getTeslaVehicles() {
  try {
    const response = await fetch(`${API_BASE}/vehicles`);
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

export function mergeWithSimulation(realVehicles, simulatedVehicles) {
  if (!realVehicles || realVehicles.length === 0) {
    return simulatedVehicles;
  }

  const realMarked = realVehicles.map((vehicle) => ({
    ...vehicle,
    id: `tesla-${vehicle.id || vehicle.vin || vehicle.display_name}`,
    vin: vehicle.vin,
    isReal: true,
    name: vehicle.display_name || 'My Real Tesla',
    status: vehicle.status || vehicle.state || 'ONLINE',
    battery: vehicle.charge_state?.battery_level ?? vehicle.battery ?? 85,
    latitude: vehicle.drive_state?.latitude ?? vehicle.latitude ?? simulatedVehicles[0]?.latitude ?? 28.5383,
    longitude: vehicle.drive_state?.longitude ?? vehicle.longitude ?? simulatedVehicles[0]?.longitude ?? -81.3792,
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
    syncedAt: vehicle.syncedAt,
    color: '#00ff9f',
  }));

  const simulatedOnly = simulatedVehicles.filter((vehicle) => !vehicle.isReal);
  return [...realMarked, ...simulatedOnly].slice(0, Math.max(10, realMarked.length));
}
