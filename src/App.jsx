import { useMemo, useState } from 'react'

/* COMPONENTS */
import Sidebar from './components/Sidebar'
import KPIGrid from './components/KPIGrid'
import Timeline from './components/Timeline'
import FleetMap from './components/FleetMap'

/* PANELS */
import ForecastPanel from './panels/ForecastPanel'
import AlertCenter from './panels/AlertCenter'
import CommandCenter from './panels/CommandCenter'

/* DATA */
import chargingStations from './data/chargingStations'
import weatherZones from './data/weatherZones'
import demandZones from './data/demandZones'

/* HOOKS */
import useFleetSimulation from './hooks/useFleetSimulation'

/* =========================================================
   INITIAL FLEET
========================================================= */

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
    maintenanceScore: 92
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
    maintenanceScore: 97
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
    maintenanceScore: 71
  },
  {
    id: 'CAR-004',
    city: 'Miami',
    latitude: 25.7617,
    longitude: -80.1918,
    targetLat: 25.7907,
    targetLng: -80.1300,
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
    maintenanceScore: 95
  }
]

export default function App() {

  /* =========================================================
     APP STATE
  ========================================================== */

  const [selectedVehicle, setSelectedVehicle] = useState(null)

  const [replayMode, setReplayMode] = useState(false)

  /* =========================================================
     COMMAND QUEUE
  ========================================================== */

  const [commandQueue] = useState([
    {
      priority: 'HIGH',
      command: 'Rebalance Orlando corridor fleet capacity'
    },
    {
      priority: 'MEDIUM',
      command: 'Delay Miami charging cycle until off-peak pricing'
    },
    {
      priority: 'CRITICAL',
      command: 'Investigate anomaly spike on CAR-003'
    }
  ])

  /* =========================================================
     LIVE SIMULATION HOOK
  ========================================================== */

  const {
    fleet,
    timelineEvents,
    forecast,
    systemLoad
  } = useFleetSimulation({
    initialFleet,
    chargingStations,
    replayMode
  })

  /* =========================================================
     CALCULATED VALUES
  ========================================================== */

  const totalRevenue = useMemo(
    () =>
      fleet.reduce(
        (sum, vehicle) => sum + vehicle.revenue,
        0
      ),
    [fleet]
  )

  const avgProfitability = useMemo(
    () =>
      Math.round(
        fleet.reduce(
          (sum, vehicle) =>
            sum + vehicle.profitability,
          0
        ) / fleet.length
      ),
    [fleet]
  )

  const avgAnomalyRisk = useMemo(
    () =>
      Math.round(
        fleet.reduce(
          (sum, vehicle) =>
            sum + vehicle.anomalyRisk,
          0
        ) / fleet.length
      ),
    [fleet]
  )

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        replayMode={replayMode}
        setReplayMode={setReplayMode}
        commandQueue={commandQueue}
        demandZones={demandZones}
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">

        <div className="max-w-[1900px] mx-auto">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <header className="mb-8">

            <div className="flex items-center gap-3 mb-3">

              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>

              <span className="uppercase tracking-[0.3em] text-green-300 text-xs">
                Fleet Live
              </span>

            </div>

            <div className="flex items-center justify-between flex-wrap gap-6">

              <div>

                <h1 className="text-5xl xl:text-6xl font-black mb-4 leading-none">

                  Autonomous Fleet

                  <span className="block text-cyan-300">
                    Operations Center
                  </span>

                </h1>

                <p className="text-slate-400 max-w-3xl text-lg">
                  Real-time AI orchestration platform for autonomous ride-sharing,
                  dispatch optimization, anomaly monitoring, and operational forecasting.
                </p>

              </div>

              <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5 min-w-[260px]">

                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">
                  Global Fleet Status
                </p>

                <div className="space-y-3">

                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Active Vehicles
                    </span>

                    <span className="font-bold text-green-300">
                      {fleet.length}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Replay Engine
                    </span>

                    <span
                      className={`font-bold ${
                        replayMode
                          ? 'text-cyan-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {replayMode ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      AI Forecasting
                    </span>

                    <span className="font-bold text-purple-300">
                      ONLINE
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </header>

          {/* =====================================================
              KPI GRID
          ====================================================== */}

          <KPIGrid
            totalRevenue={totalRevenue}
            systemLoad={systemLoad}
            avgProfitability={avgProfitability}
            avgAnomalyRisk={avgAnomalyRisk}
            forecast={forecast}
          />

          {/* =====================================================
              FORECAST PANEL
          ====================================================== */}

          <ForecastPanel
            forecast={forecast}
          />

          {/* =====================================================
              ALERT CENTER
          ====================================================== */}

          <AlertCenter
            fleet={fleet}
          />

          {/* =====================================================
              COMMAND CENTER
          ====================================================== */}

          <CommandCenter
            replayMode={replayMode}
            setReplayMode={setReplayMode}
            fleet={fleet}
          />

          {/* =====================================================
              TIMELINE
          ====================================================== */}

          <Timeline
            timelineEvents={timelineEvents}
            replayMode={replayMode}
          />

          {/* =====================================================
              MAP
          ====================================================== */}

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
  )
}