import { useMemo, useState } from 'react';
import FleetMap from './components/FleetMap';
import KPIGrid from './components/KPIGrid';
import MobileBottomNav from './components/MobileBottomNav';
import PageHeader from './components/PageHeader';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import AIRecommendationPanel from './panels/AIRecommendationPanel';
import AgentOrchestrationPanel from './panels/AgentOrchestrationPanel';
import AssetManagementPanel from './panels/AssetManagementPanel';
import ChargingReadinessPanel from './panels/ChargingReadinessPanel';
import CommandCenter from './panels/CommandCenter';
import CommandInboxPanel from './panels/CommandInboxPanel';
import DispatchPlannerPanel from './panels/DispatchPlannerPanel';
import DriverlessReadinessPanel from './panels/DriverlessReadinessPanel';
import FleetFinancePanel from './panels/FleetFinancePanel';
import ForecastPanel from './panels/ForecastPanel';
import FleetListPanel from './panels/FleetListPanel';
import IntelligentAlertCenter from './panels/IntelligentAlertCenter';
import IntegrationsPanel from './panels/IntegrationsPanel';
import MemoryEventsPanel from './panels/MemoryEventsPanel';
import MobileCommandDashboard from './panels/MobileCommandDashboard';
import OperationsReportPanel from './panels/OperationsReportPanel';
import QuickActionGrid from './panels/QuickActionGrid';
import SettingsPanel from './panels/SettingsPanel';
import TeslaCapabilitiesPanel from './panels/TeslaCapabilitiesPanel';
import TeslaTelemetryPanel from './panels/TeslaTelemetryPanel';
import VehicleDetailPanel from './panels/VehicleDetailPanel';
import VehicleShowcasePanel from './panels/VehicleShowcasePanel';
import chargingStations from './data/chargingStations';
import demandZones from './data/demandZones';
import weatherZones from './data/weatherZones';
import useAiFleetAnalysis from './hooks/useAiFleetAnalysis';
import useHashRoute from './hooks/useHashRoute';
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
  const [route, navigate] = useHashRoute();

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
  const activeVehicle = selectedVehicle || primaryTesla || fleet[0] || null;
  const { analysis: aiAnalysis, isAnalyzing } = useAiFleetAnalysis({
    fleet,
    realSyncStatus,
  });

  const combinedTimeline = [
    ...commandQueue.map((cmd) => ({
      message: cmd.command,
      time: cmd.priority,
    })),
    ...timelineEvents,
  ];

  const operationsStatus = (
    <div className="w-full rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/10 sm:min-w-[280px] sm:w-auto sm:p-5">
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

        <button
          onClick={refreshRealTesla}
          disabled={isLoadingReal}
          className="w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoadingReal ? 'Syncing Tesla...' : 'Sync Tesla Telemetry'}
        </button>
      </div>
    </div>
  );

  const pages = {
    overview: (
      <>
        <div className="md:hidden">
          <MobileCommandDashboard
            fleet={fleet}
            primaryTesla={primaryTesla}
            totalRevenue={totalRevenue}
            avgAnomalyRisk={avgAnomalyRisk}
            onSync={refreshRealTesla}
            onExecute={enqueueCommand}
            onNavigate={navigate}
            isLoading={isLoadingReal}
            syncStatus={realSyncStatus}
          />
        </div>
        <div className="hidden md:block">
          <PageHeader
            eyebrow="Live Operations"
            title={<><span>FleetOS</span><span className="block text-sky-300">Operations Console</span></>}
            description="A fleet operating system for live Tesla telemetry, dispatch simulation, charging intelligence, and operational risk monitoring."
            action={operationsStatus}
          />
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
          <VehicleShowcasePanel
            vehicle={primaryTesla}
            fleet={fleet}
            onSync={refreshRealTesla}
            isLoading={isLoadingReal}
          />
          <AgentOrchestrationPanel
            analysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            realVehicleCount={realVehicles.length}
            commandCount={commandQueue.length}
          />
          <QuickActionGrid
            onSync={refreshRealTesla}
            onExecute={enqueueCommand}
            isLoading={isLoadingReal}
          />
          <ForecastPanel forecast={forecast} />
        </div>
      </>
    ),
    map: (
      <>
        <PageHeader
          eyebrow="Live Map"
          title="Fleet Map"
          description="Track real Tesla telemetry, simulated fleet movement, charging hubs, and demand overlays in one operating view."
          action={operationsStatus}
        />
        <FleetMap
          fleet={fleet}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          weatherZones={weatherZones}
          demandZones={demandZones}
          chargingStations={chargingStations}
        />
      </>
    ),
    fleet: (
      <>
        <PageHeader
          eyebrow="Fleet Registry"
          title="Vehicles"
          description="Separate observed Tesla telemetry from the simulated fleet layer and inspect vehicle readiness."
          action={operationsStatus}
        />
        <FleetListPanel
          fleet={fleet}
          onSelect={(vehicle) => {
            setSelectedVehicle(vehicle);
            navigate('vehicle');
          }}
        />
      </>
    ),
    vehicle: (
      <>
        <PageHeader
          eyebrow="Vehicle Detail"
          title={activeVehicle ? activeVehicle.name || activeVehicle.display_name || activeVehicle.id : 'Vehicle Detail'}
          description="Inspect telemetry, readiness, controls, and AI actions for the selected fleet vehicle."
          action={operationsStatus}
        />
        <VehicleDetailPanel
          vehicle={activeVehicle}
          onSync={refreshRealTesla}
          isLoading={isLoadingReal}
          onShowMap={() => navigate('map')}
          onQueueCommand={enqueueCommand}
        />
      </>
    ),
    assets: (
      <>
        <PageHeader
          eyebrow="Asset Management"
          title="Fleet Financials"
          description="Track acquisition cost, outstanding balances, tags, model years, registration, and ownership details across the fleet."
          action={operationsStatus}
        />
        <AssetManagementPanel fleet={fleet} />
      </>
    ),
    finance: (
      <>
        <PageHeader
          eyebrow="Owner Economics"
          title="Finance"
          description="Track revenue, operating cost, loan exposure, equity, and ROI so FleetOS can prove whether the fleet is making money."
          action={operationsStatus}
        />
        <FleetFinancePanel
          fleet={fleet}
          onQueueCommand={enqueueCommand}
        />
      </>
    ),
    charging: (
      <>
        <PageHeader
          eyebrow="Energy Operations"
          title="Charging"
          description="Translate battery and charging telemetry into dispatch readiness, range planning, and charge-priority decisions."
          action={operationsStatus}
        />
        <ChargingReadinessPanel
          fleet={fleet}
          onQueueCommand={enqueueCommand}
        />
      </>
    ),
    dispatch: (
      <>
        <PageHeader
          eyebrow="AI Planning"
          title="Dispatch Planner"
          description="Plan tonight's staging, charging, and revenue opportunities while keeping Tesla autonomous execution boundaries clear."
          action={operationsStatus}
        />
        <DispatchPlannerPanel
          fleet={fleet}
          demandZones={demandZones}
          chargingStations={chargingStations}
          onQueueCommand={enqueueCommand}
          onShowMap={() => navigate('map')}
        />
      </>
    ),
    readiness: (
      <>
        <PageHeader
          eyebrow="Robotaxi Readiness"
          title="Driverless Readiness"
          description="Score each vehicle for future driverless operations across battery, telemetry, maintenance, risk, compliance, and Tesla autonomy dependency."
          action={operationsStatus}
        />
        <DriverlessReadinessPanel
          fleet={fleet}
          onQueueCommand={enqueueCommand}
        />
      </>
    ),
    ai: (
      <>
        <PageHeader
          eyebrow="AI Command"
          title="AI Operations"
          description="Review next best actions, confidence scores, and one-click execution recommendations from the FleetOS AI layer."
          action={operationsStatus}
        />
        <AIRecommendationPanel
          recommendations={aiAnalysis.recommendations}
          isAnalyzing={isAnalyzing}
          onExecute={enqueueCommand}
        />
        <CommandInboxPanel commandQueue={commandQueue} />
        <CommandCenter
          replayMode={replayMode}
          setReplayMode={setReplayMode}
          fleet={fleet}
          enqueueCommand={enqueueCommand}
        />
      </>
    ),
    alerts: (
      <>
        <PageHeader
          eyebrow="AI Triage"
          title="Alerts"
          description="Prioritized fleet alerts with AI explanations, risk scores, and recommended operator action."
          action={operationsStatus}
        />
        <IntelligentAlertCenter analysis={aiAnalysis} isAnalyzing={isAnalyzing} />
        <Timeline timelineEvents={combinedTimeline} replayMode={replayMode} />
      </>
    ),
    memory: (
      <>
        <PageHeader
          eyebrow="Fleet Memory"
          title="Events"
          description="Capture telemetry, alerts, recommendations, and commands as future retrieval memory for FleetOS AI."
          action={operationsStatus}
        />
        <MemoryEventsPanel
          fleet={fleet}
          analysis={aiAnalysis}
          commandQueue={commandQueue}
          realSyncStatus={realSyncStatus}
        />
      </>
    ),
    reports: (
      <>
        <PageHeader
          eyebrow="Operations Intelligence"
          title="Reports"
          description="Review fleet health, AI analysis quality, telemetry freshness, and operator command history."
          action={operationsStatus}
        />
        <OperationsReportPanel
          fleet={fleet}
          analysis={aiAnalysis}
          commandQueue={commandQueue}
          realSyncStatus={realSyncStatus}
        />
      </>
    ),
    integrations: (
      <>
        <PageHeader
          eyebrow="Platform"
          title="Integrations"
          description="Review connected services, AI runtime, Tesla Fleet API telemetry, and planned memory/RAG infrastructure."
          action={operationsStatus}
        />
        <IntegrationsPanel
          aiAnalysis={aiAnalysis}
          realSyncStatus={realSyncStatus}
        />
      </>
    ),
    tesla: (
      <>
        <PageHeader
          eyebrow="Tesla Fleet API"
          title="Capabilities"
          description="See exactly which Tesla APIs FleetOS uses today, which controls are safe to operate, and which commands should be added next."
          action={operationsStatus}
        />
        <TeslaCapabilitiesPanel
          vehicle={primaryTesla}
          syncStatus={realSyncStatus}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
          onShowMap={() => navigate('map')}
          onQueueCommand={enqueueCommand}
        />
      </>
    ),
    settings: (
      <>
        <PageHeader
          eyebrow="Administration"
          title="Settings"
          description="Manage telemetry sync, AI runtime status, and operating modes."
        />
        <SettingsPanel
          realSyncStatus={realSyncStatus}
          isLoadingReal={isLoadingReal}
          onSync={refreshRealTesla}
          aiAnalysis={aiAnalysis}
          replayMode={replayMode}
          setReplayMode={setReplayMode}
        />
      </>
    ),
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex">
      <Sidebar
        replayMode={replayMode}
        setReplayMode={setReplayMode}
        commandQueue={commandQueue}
        demandZones={demandZones}
        route={route}
        onNavigate={navigate}
      />

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
        <div className="mx-auto max-w-[1900px]">
          {pages[route] || pages.overview}
        </div>
      </main>

      <MobileBottomNav route={route} onNavigate={navigate} />
    </div>
  );
}
