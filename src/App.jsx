import { useMemo, useState } from 'react';
import FleetMap from './components/FleetMap';
import KPIGrid from './components/KPIGrid';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import AlertCenter from './panels/AlertCenter';
import CommandCenter from './panels/CommandCenter';
import ForecastPanel from './panels/ForecastPanel';
import TeslaTelemetryPanel from './panels/TeslaTelemetryPanel';
import chargingStations from './data/chargingStations';
import demandZones from './data/demandZones';
import weatherZones from './data/weatherZones';
import { useFleetSimulation } from './hooks/useFleetSimulation';

const initialFleet = [
  {
    id: 'CAR-001',
    city: 'Lakeland',
    latitude: 28.0395,
    longitude: -81.9498,
    targetLat: 28.5383,
    targetLng: -81.3792,
    battery: 78,
    revenue: 4822,
    utilization: 72,
    status: 'REPOSITIONING',
    assignment: 'Heading toward Orlando demand corridor',
    health: 'GOOD',
    passengers: 2,
    efficiency: 94,
    downtime: 1.2,
    profitability: 87,
    anomalyRisk: 8,
    maintenanceScore: 92,
  },
  {
    id: 'CAR-002',
    city: 'Orlando',
    latitude: 28.5383,
    longitude: -81.3792,
    targetLat: 28.4743,
    targetLng: -81.4678,
    battery: 92,
    revenue: 3910,
    utilization: 64,
    status: 'PICKUP',
    assignment: 'Airport pickup assignment',
    health: 'GOOD',
    passengers: 1,
    efficiency: 97,
    downtime: 0.4,
    profitability: 93,
    anomalyRisk: 4,
    maintenanceScore: 97,
  },
  {
    id: 'CAR-003',
    city: 'Tampa',
    latitude: 27.9506,
    longitude: -82.4572,
    targetLat: 27.9642,
    targetLng: -82.4526,
    battery: 29,
    revenue: 6201,
    utilization: 81,
    status: 'IN SERVICE',
    assignment: 'Downtown Tampa passenger trip',
    health: 'GOOD',
    passengers: 3,
    efficiency: 91,
    downtime: 2.1,
    profitability: 84,
    anomalyRisk: 24,
    maintenanceScore: 71,
  },
  {
    id: 'CAR-004',
    city: 'Miami',
    latitude: 25.7617,
    longitude: -80.1918,
    targetLat: 25.7907,
    targetLng: -80.13,
    battery: 84,
    revenue: 5202,
    utilization: 69,
    status: 'EN ROUTE',
    assignment: 'South Beach destination route',
    health: 'GOOD',
    passengers: 2,
    efficiency: 96,
    downtime: 0.8,
    profitability: 90,
    anomalyRisk: 6,
    maintenanceScore: 95,
  },
];

export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const {
    fleet,
    timelineEvents,
    forecast,
    systemLoad,
    replayMode,
    setReplayMode,
    commandQueue,
    enqueueCommand,
    refreshRealTesla,
    isLoadingReal,
    realSyncStatus,
  } = useFleetSimulation({
    initialFleet,
    chargingStations,
    replayModeInitial: false,
  });

  const totalRevenue = useMemo(
    () => fleet.reduce((sum, vehicle) => sum + (vehicle.revenue || 0), 0),
    [fleet],
  );

  const avgProfitability = useMemo(
    () => Math.round(fleet.reduce((sum, vehicle) => sum + vehicle.profitability, 0) / fleet.length),
    [fleet],
  );

  const avgAnomalyRisk = useMemo(
    () => Math.round(fleet.reduce((sum, vehicle) => sum + vehicle.anomalyRisk, 0) / fleet.length),
    [fleet],
  );

  const realVehicles = useMemo(
    () => fleet.filter((vehicle) => vehicle.isReal),
    [fleet],
  );

  const simulatedVehicles = useMemo(
    () => fleet.filter((vehicle) => !vehicle.isReal),
    [fleet],
  );

  const primaryTesla = realVehicles[0] || null;

  const combinedTimeline = [
    ...commandQueue.map((cmd) => ({
      message: cmd.command,
      time: cmd.priority,
    })),
    ...timelineEvents,
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex">
      <Sidebar
        replayMode={replayMode}
        setReplayMode={setReplayMode}
        commandQueue={commandQueue}
        demandZones={demandZones}
      />

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] p-6 lg:p-8">
        <div className="max-w-[1900px] mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="uppercase tracking-[0.28em] text-emerald-300 text-xs">
                Live Operations
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <h1 className="text-4xl xl:text-5xl font-black mb-4 leading-tight tracking-tight">
                  FleetOS
                  <span className="block text-sky-300">Operations Console</span>
                </h1>

                <p className="text-slate-400 max-w-3xl text-lg">
                  A fleet operating system for live Tesla telemetry, dispatch simulation,
                  charging intelligence, and operational risk monitoring.
                </p>
              </div>

              <div className="min-w-[280px] rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300 mb-3">
                  Operations Status
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Vehicles</span>
                    <span className="font-bold text-emerald-300">{fleet.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Real Tesla</span>
                    <span className="font-bold text-emerald-300">{realVehicles.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulation Fleet</span>
                    <span className="font-bold text-slate-300">{simulatedVehicles.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Replay Engine</span>
                    <span className={`font-bold ${replayMode ? 'text-sky-300' : 'text-slate-500'}`}>
                      {replayMode ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>

                  <button
                    onClick={refreshRealTesla}
                    disabled={isLoadingReal}
                    className="w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isLoadingReal ? 'Syncing Tesla...' : 'Sync Tesla Telemetry'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <KPIGrid
            totalRevenue={totalRevenue}
            systemLoad={systemLoad}
            avgProfitability={avgProfitability}
            avgAnomalyRisk={avgAnomalyRisk}
            forecast={forecast}
          />

          <TeslaTelemetryPanel
            vehicle={primaryTesla}
            syncStatus={realSyncStatus}
            isLoading={isLoadingReal}
            onSync={refreshRealTesla}
          />

          <ForecastPanel forecast={forecast} />
          <AlertCenter fleet={fleet} />

          <CommandCenter
            replayMode={replayMode}
            setReplayMode={setReplayMode}
            fleet={fleet}
            enqueueCommand={enqueueCommand}
          />

          <Timeline timelineEvents={combinedTimeline} replayMode={replayMode} />

          <FleetMap
            fleet={fleet}
            selectedVehicle={selectedVehicle}
            setSelectedVehicle={setSelectedVehicle}
            weatherZones={weatherZones}
            demandZones={demandZones}
            chargingStations={chargingStations}
          />
        </div>
      </main>
    </div>
  );
}
