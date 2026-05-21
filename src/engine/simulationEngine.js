// src/engine/simulationEngine.js
const FALLBACK_DESTINATIONS = [
  [28.5383, -81.3792],
  [28.4312, -81.3081],
  [28.3772, -81.5707],
  [27.9506, -82.4572],
  [25.7907, -80.13],
];

function nearestChargingStation(latitude, longitude, chargingStations) {
  return chargingStations.reduce((nearest, station) => {
    const distance = Math.hypot(station.latitude - latitude, station.longitude - longitude);
    return !nearest || distance < nearest.distance ? { ...station, distance } : nearest;
  }, null);
}

export function updateFleet({ fleet, chargingStations = [], replayMode = false }) {
  return fleet.map((vehicle) => {
    if (vehicle.isReal) {
      return vehicle;
    }

    let { 
      latitude = 28.5383, 
      longitude = -81.3792, 
      targetLat = 28.5383 + (Math.random() - 0.5) * 0.3,
      targetLng = -81.3792 + (Math.random() - 0.5) * 0.3,
      status = 'IDLE',
      battery = 75,
      passengers = 0,
      utilization = 70,
      revenue = 0,
      profitability = 80,
      anomalyRisk = 0,
      maintenanceScore = 90,
      assignment = 'Autonomous dispatch assignment',
      efficiency = 92,
      isReal = false
    } = vehicle;

    // Keep coordinates valid
    latitude = parseFloat(latitude) || 28.5383;
    longitude = parseFloat(longitude) || -81.3792;

    if (battery < 32 && chargingStations.length > 0) {
      const station = nearestChargingStation(latitude, longitude, chargingStations);
      targetLat = station.latitude;
      targetLng = station.longitude;
      status = battery < 26 ? 'CHARGING' : 'REPOSITIONING';
      assignment = `Routing to ${station.name}`;
    }

    const latDiff = targetLat - latitude;
    const lngDiff = targetLng - longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Arrived at destination
    if (distance < 0.015) {
      const next = FALLBACK_DESTINATIONS[Math.floor(Math.random() * FALLBACK_DESTINATIONS.length)];
      targetLat = next[0];
      targetLng = next[1];

      const nextStatus = ['EN ROUTE', 'PICKUP', 'REPOSITIONING', 'IDLE'][Math.floor(Math.random() * 4)];
      status = nextStatus;
      assignment =
        nextStatus === 'PICKUP'
          ? 'Passenger pickup assignment'
          : nextStatus === 'REPOSITIONING'
            ? 'Rebalancing toward demand corridor'
            : nextStatus === 'EN ROUTE'
              ? 'Passenger destination route'
              : 'Staged for next dispatch';
    }

    // Move
    const moveSpeed = replayMode ? 0.035 : 0.015;
    const newLat = latitude + latDiff * moveSpeed;
    const newLng = longitude + lngDiff * moveSpeed;

    // Battery drain
    battery =
      status === 'CHARGING'
        ? Math.min(100, battery + 0.8 * (replayMode ? 2 : 1))
        : Math.max(15, battery - (status === 'IDLE' ? 0.03 : 0.12) * (replayMode ? 1.8 : 1));
    revenue += status === 'IDLE' || status === 'CHARGING' ? 0 : Math.round(18 + profitability * 0.12);
    utilization = Math.max(30, Math.min(99, utilization + (Math.random() - 0.48) * 3));
    profitability = Math.max(45, Math.min(99, profitability + (Math.random() - 0.5) * 2));
    anomalyRisk = Math.max(0, Math.min(35, anomalyRisk + (Math.random() - 0.5) * 2.5));
    maintenanceScore = Math.max(55, Math.min(99, maintenanceScore - Math.random() * 0.15));
    efficiency = Math.max(80, Math.min(99, efficiency + (Math.random() - 0.5)));

    return {
      ...vehicle,
      latitude: newLat,
      longitude: newLng,
      targetLat,
      targetLng,
      status,
      assignment,
      battery: Math.round(battery),
      passengers: Math.max(0, passengers || 0),
      revenue,
      utilization,
      profitability,
      anomalyRisk,
      maintenanceScore,
      efficiency: Math.round(efficiency),
      isReal
    };
  });
}
