import { useEffect, useState } from 'react';
import { updateFleet } from '../engine/simulationEngine';
import chargingStationsFallback from '../data/chargingStations';
import demandZones from '../data/demandZones';
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { appendFleetMemory } from '../services/fleetMemory';
import { getTeslaVehicles, mergeWithSimulation } from '../services/teslaService';

const generatedFleet = Array.from({ length: 10 }, (_, i) => ({
  id: `CAR-${String(i + 1).padStart(3, '0')}`,
  city: ['Orlando', 'Tampa', 'Miami', 'Lakeland'][i % 4],
  latitude: 28.5383 + (Math.random() - 0.5) * 0.4,
  longitude: -81.3792 + (Math.random() - 0.5) * 0.4,
  targetLat: 28.4312,
  targetLng: -81.3081,
  battery: 60 + Math.random() * 35,
  revenue: 3200 + Math.round(Math.random() * 3800),
  utilization: 65 + Math.random() * 30,
  status: ['EN ROUTE', 'PICKUP', 'REPOSITIONING', 'IDLE'][Math.floor(Math.random() * 4)],
  assignment: 'Autonomous dispatch assignment',
  health: 'GOOD',
  passengers: Math.floor(Math.random() * 4),
  efficiency: 88 + Math.round(Math.random() * 10),
  downtime: Math.random() * 2,
  profitability: 70 + Math.random() * 25,
  anomalyRisk: Math.random() * 18,
  maintenanceScore: 75 + Math.random() * 20,
}));

function average(fleet, key) {
  if (fleet.length === 0) return 0;
  return Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle[key] || 0), 0) / fleet.length);
}

function buildForecast(fleet) {
  const mostProfitableZone = demandZones.reduce((best, zone) => (
    zone.profitability > best.profitability ? zone : best
  ), demandZones[0]);
  const avgAnomalyRisk = average(fleet, 'anomalyRisk');
  const activeVehicles = fleet.filter((vehicle) => vehicle.status !== 'IDLE').length;

  return {
    projectedRevenue: Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.revenue || 0), 0) * 1.18),
    surgeRisk: activeVehicles > fleet.length * 0.75 ? 'HIGH' : activeVehicles > fleet.length * 0.45 ? 'MED' : 'LOW',
    predictedDemand: mostProfitableZone.name,
    congestionRisk: avgAnomalyRisk > 18 ? 'HIGH' : avgAnomalyRisk > 10 ? 'MEDIUM' : 'LOW',
    aiConfidence: Math.max(82, 98 - avgAnomalyRisk),
  };
}

const eventPool = [
  { severity: 'INFO', message: 'AI rerouted Tampa corridor coverage.' },
  { severity: 'WARNING', message: 'Charging congestion detected in Orlando.' },
  { severity: 'SUCCESS', message: 'Autonomous charging optimization completed.' },
  { severity: 'CRITICAL', message: 'Emergency override activated for Miami region.' },
  { severity: 'WARNING', message: 'Dynamic surge pricing enabled.' },
  { severity: 'CRITICAL', message: 'AI anomaly detection triggered on CAR-003.' },
];

export function useFleetSimulation({
  initialFleet = generatedFleet,
  chargingStations = chargingStationsFallback,
  replayModeInitial = false,
  autoSyncReal = true,
} = {}) {
  const [fleet, setFleet] = useState(initialFleet);
  const [replayMode, setReplayMode] = useState(replayModeInitial);
  const [isLoadingReal, setIsLoadingReal] = useState(false);
  const [realSyncStatus, setRealSyncStatus] = useState({
    state: 'idle',
    lastSyncedAt: null,
    message: 'Tesla telemetry has not synced yet.',
  });
  const [timelineEvents, setTimelineEvents] = useState([
    {
      time: '7:42 PM',
      severity: 'INFO',
      message: 'Fleet orchestration engine initialized.',
    },
    {
      time: '7:44 PM',
      severity: 'SUCCESS',
      message: 'AI demand balancing activated.',
    },
  ]);
  const [commandQueue, setCommandQueue] = useState([
    { priority: 'HIGH', command: 'Rebalance Orlando corridor fleet capacity' },
    { priority: 'MEDIUM', command: 'Delay Miami charging cycle until off-peak pricing' },
    { priority: 'CRITICAL', command: 'Investigate anomaly spike on CAR-003' },
  ]);

  useEffect(() => {
    const refreshOwnership = () => {
      setFleet((current) => current.map((vehicle) => ({
        ...vehicle,
        ownership: getVehicleOwnership(vehicle) || vehicle.ownership,
      })));
    };

    window.addEventListener('fleetos-ownership-updated', refreshOwnership);
    window.addEventListener('storage', refreshOwnership);
    return () => {
      window.removeEventListener('fleetos-ownership-updated', refreshOwnership);
      window.removeEventListener('storage', refreshOwnership);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((current) => updateFleet({ fleet: current, chargingStations, replayMode }));

      if (Math.random() < 0.16) {
        const nextEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
        const time = new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });

        setTimelineEvents((current) => [
          {
            time,
            severity: nextEvent.severity,
            message: nextEvent.message,
          },
          ...current.slice(0, 18),
        ]);
      }
    }, replayMode ? 500 : 1200);

    return () => clearInterval(interval);
  }, [chargingStations, replayMode]);

  const refreshRealTesla = async () => {
    setIsLoadingReal(true);
    setRealSyncStatus((current) => ({
      ...current,
      state: 'loading',
      message: 'Syncing Tesla telemetry...',
    }));

    try {
      const realVehicles = await getTeslaVehicles();

      if (!realVehicles || realVehicles.length === 0) {
        setRealSyncStatus({
          state: 'error',
          lastSyncedAt: null,
          message: 'No Tesla vehicles returned from the telemetry API.',
        });
        return;
      }

      const syncedAt = new Date().toISOString();
      setFleet((current) => mergeWithSimulation(realVehicles, current));
      realVehicles.forEach((vehicle) => {
        appendFleetMemory({
          type: 'Telemetry',
          title: `${vehicle.display_name || vehicle.name || vehicle.vin || 'Tesla'} telemetry sync`,
          detail: `${vehicle.status || vehicle.state || 'Online'} with ${Math.round(vehicle.battery || 0)}% battery and ${vehicle.chargingState || 'unknown charge state'}.`,
          timestamp: syncedAt,
          source: 'Tesla Fleet API',
          status: 'synced',
          ragReady: true,
          metadata: {
            vin: vehicle.vin,
            battery: vehicle.battery,
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            chargingState: vehicle.chargingState,
            odometer: vehicle.odometer,
          },
        });
      });
      setRealSyncStatus({
        state: 'success',
        lastSyncedAt: syncedAt,
        message: `${realVehicles.length} Tesla vehicle${realVehicles.length === 1 ? '' : 's'} synced.`,
      });
    } catch (error) {
      setRealSyncStatus({
        state: 'error',
        lastSyncedAt: null,
        message: error.message || 'Tesla telemetry sync failed.',
      });
    } finally {
      setIsLoadingReal(false);
    }
  };

  useEffect(() => {
    if (!autoSyncReal) return undefined;

    const timer = window.setTimeout(() => {
      refreshRealTesla();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoSyncReal]);

  const enqueueCommand = (command, priority = 'NORMAL') => {
    appendFleetMemory({
      type: 'Command',
      title: command,
      detail: 'Operator command queued from FleetOS workflow.',
      source: priority,
      status: 'queued',
      ragReady: false,
      metadata: { priority },
    });

    setCommandQueue((current) => [
      { priority, command, timestamp: new Date().toISOString() },
      ...current.slice(0, 5),
    ]);
  };

  return {
    fleet,
    setFleet,
    timelineEvents,
    forecast: buildForecast(fleet),
    systemLoad: Math.min(99, Math.max(45, average(fleet, 'utilization'))),
    totalRevenue: fleet.reduce((sum, vehicle) => sum + (vehicle.revenue || 0), 0),
    avgProfitability: average(fleet, 'profitability'),
    avgAnomalyRisk: average(fleet, 'anomalyRisk'),
    replayMode,
    setReplayMode,
    commandQueue,
    enqueueCommand,
    refreshRealTesla,
    isLoadingReal,
    realSyncStatus,
    demandZones,
    chargingStations,
  };
}

export default useFleetSimulation;
