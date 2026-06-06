import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthenticateWithRedirectCallback } from '@clerk/react';
import CommandSafetyModal from './components/CommandSafetyModal';
import FeedbackButton from './components/FeedbackButton';
import MobileBottomNav from './components/MobileBottomNav';
import PageHeader from './components/PageHeader';
import RoboLogo from './components/RoboLogo';
import RoboWordmark from './components/RoboWordmark';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import AIRecommendationPanel from './panels/AIRecommendationPanel';
import AccountPanel from './panels/AccountPanel';
import AssetManagementPanel from './panels/AssetManagementPanel';
import BetaAdminPanel from './panels/BetaAdminPanel';
import ChargingReadinessPanel from './panels/ChargingReadinessPanel';
import DispatchPlannerPanel from './panels/DispatchPlannerPanel';
import DriverlessReadinessPanel from './panels/DriverlessReadinessPanel';
import FleetFinancePanel from './panels/FleetFinancePanel';
import FleetHealthDashboard from './panels/FleetHealthDashboard';
import FleetListPanel from './panels/FleetListPanel';
import IntelligentAlertCenter from './panels/IntelligentAlertCenter';
import IntegrationsPanel from './panels/IntegrationsPanel';
import LandingPage, { AgentAboutPage, AgentChatPage, HowItWorksPage } from './panels/LandingPage';
import LegalPage from './panels/LegalPage';
import MemoryEventsPanel from './panels/MemoryEventsPanel';
import CommandDashboard from './panels/CommandDashboard';
import OnboardingPanel from './panels/OnboardingPanel';
import OperationsReportPanel from './panels/OperationsReportPanel';
import RoboAgentAskPanel from './panels/RoboAgentAskPanel';
import SettingsPanel from './panels/SettingsPanel';
import TeslaCapabilitiesPanel from './panels/TeslaCapabilitiesPanel';
import VehicleDetailPanel from './panels/VehicleDetailPanel';
import chargingStations from './data/chargingStations';
import demandZones from './data/demandZones';
import weatherZones from './data/weatherZones';
import useAiFleetAnalysis from './hooks/useAiFleetAnalysis';
import useHashRoute from './hooks/useHashRoute';
import { useFleetSimulation } from './hooks/useFleetSimulation';
import { canUseTeslaTelemetry } from './services/betaCompliance';

const FleetMap = lazy(() => import('./components/FleetMap'));

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

function SsoCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 text-[#141b27]">
      <AuthenticateWithRedirectCallback />
      <div className="text-center">
        <RoboLogo className="mx-auto h-16 w-16" />
        <p className="mt-3 text-xl">
          <RoboWordmark />
        </p>
        <h1 className="mt-3 text-3xl font-black">Finishing secure sign in...</h1>
        <p className="mt-3 text-sm text-slate-500">You will return to onboarding automatically.</p>
      </div>
    </div>
  );
}

export default function App() {
  if (window.location.pathname === '/sso-callback') return <SsoCallbackPage />;

  return <FleetApp />;
}

function FleetApp() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [, setComplianceRevision] = useState(0);
  const [route, navigate] = useHashRoute();
  const isPublicRoute = route === 'landing';
  const isPublicAgentRoute = route === 'agent';
  const isPublicAboutRoute = route === 'about';
  const isPublicHowItWorksRoute = route === 'how-it-works';
  const isPublicLegalRoute = route === 'privacy' || route === 'terms';
  const isPublicOnboardingRoute = route === 'onboarding';
  const isPublicAccountRoute = route === 'account';
  const teslaConsentReady = canUseTeslaTelemetry();
  const shouldAutoSyncReal = !(
    isPublicRoute ||
    isPublicAgentRoute ||
    isPublicAboutRoute ||
    isPublicHowItWorksRoute ||
    isPublicLegalRoute ||
    isPublicOnboardingRoute ||
    isPublicAccountRoute
  );

  useEffect(() => {
    const refreshCompliance = () => setComplianceRevision((current) => current + 1);
    window.addEventListener('fleetos-compliance-updated', refreshCompliance);
    return () => window.removeEventListener('fleetos-compliance-updated', refreshCompliance);
  }, []);

  const {
    fleet,
    timelineEvents,
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
    autoSyncReal: shouldAutoSyncReal,
    canSyncReal: teslaConsentReady,
  });

  const totalRevenue = useMemo(
    () => fleet.reduce((sum, vehicle) => sum + (vehicle.revenue || 0), 0),
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
    enabled: !isPublicRoute,
  });
  const requestCommand = (command, priority = 'NORMAL') => {
    setPendingCommand({
      command,
      priority,
      requestedAt: new Date().toISOString(),
    });
  };

  const confirmCommand = () => {
    if (!pendingCommand) return;
    enqueueCommand(pendingCommand.command, pendingCommand.priority);
    setPendingCommand(null);
  };

  const combinedTimeline = [
    ...commandQueue.map((cmd) => ({
      message: cmd.command,
      time: cmd.priority,
    })),
    ...timelineEvents,
  ];

  const operationsStatus = (
    <div className="w-full rounded-lg border border-[#141b27]/10 bg-white/80 p-4 shadow-xl shadow-slate-900/10 sm:min-w-[280px] sm:w-auto sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Operations Status
      </p>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Active Vehicles</span>
          <span className="font-bold text-[#141b27]">{fleet.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Real Tesla</span>
          <span className="font-bold text-[#141b27]">{realVehicles.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Simulation Fleet</span>
          <span className="font-bold text-slate-700">{simulatedVehicles.length}</span>
        </div>

        <button
          onClick={refreshRealTesla}
          disabled={isLoadingReal}
          className="w-full rounded-md border border-[#172231]/15 bg-[#172231] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#243044] disabled:cursor-wait disabled:opacity-60"
        >
          {isLoadingReal ? 'Syncing Tesla...' : 'Sync Tesla Telemetry'}
        </button>
      </div>
    </div>
  );

  const pages = {
    overview: (
      <CommandDashboard
        fleet={fleet}
        primaryTesla={primaryTesla}
        totalRevenue={totalRevenue}
        avgAnomalyRisk={avgAnomalyRisk}
        commandQueue={commandQueue}
        onSync={refreshRealTesla}
        onExecute={requestCommand}
        onNavigate={navigate}
        onSelectVehicle={setSelectedVehicle}
        isLoading={isLoadingReal}
        syncStatus={realSyncStatus}
      />
    ),
    onboarding: (
      <>
        <PageHeader
          eyebrow="Beta Onboarding"
          title="Connect Your First Tesla"
          description="A guided mobile-friendly setup for account creation, data consent, Tesla OAuth, first sync, and dashboard handoff."
        />
        <OnboardingPanel
          realVehicleCount={realVehicles.length}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
          onNavigate={navigate}
        />
      </>
    ),
    map: (
      <Suspense
        fallback={(
          <div className="flex h-[70vh] min-h-[460px] items-center justify-center rounded-2xl border border-[#141b27]/10 bg-white/80 text-sm font-medium text-slate-500 shadow-sm lg:h-[calc(100vh-8rem)]">
            Loading fleet map...
          </div>
        )}
      >
        <FleetMap
          fleet={fleet}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          weatherZones={weatherZones}
          demandZones={demandZones}
          chargingStations={chargingStations}
          onQueueCommand={requestCommand}
          onShowDetail={(vehicle) => {
            setSelectedVehicle(vehicle);
            navigate('vehicle');
          }}
        />
      </Suspense>
    ),
    fleet: (
      <>
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
          eyebrow="Fleet"
          title="Vehicle Detail"
          action={operationsStatus}
        />
        <VehicleDetailPanel
          vehicle={activeVehicle}
          onSync={refreshRealTesla}
          isLoading={isLoadingReal}
          onShowMap={() => navigate('map')}
          onQueueCommand={requestCommand}
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
        <AssetManagementPanel
          fleet={fleet}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
        />
      </>
    ),
    finance: (
      <>
        <PageHeader
          eyebrow="Owner Economics"
          title="Finance"
          description="Track revenue, operating cost, loan exposure, equity, and ROI so ROBOAGENT can prove whether the fleet is making money."
          action={operationsStatus}
        />
        <FleetFinancePanel
          fleet={fleet}
          onQueueCommand={requestCommand}
        />
      </>
    ),
    health: (
      <>
        <PageHeader
          eyebrow="Fleet Health"
          title="Robotaxi Health"
          description="Estimate utilization and earnings, schedule cleaning and maintenance, and turn fleet health signals into AI-prioritized actions."
          action={operationsStatus}
        />
        <FleetHealthDashboard
          fleet={fleet}
          onQueueCommand={requestCommand}
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
          onQueueCommand={requestCommand}
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
          onQueueCommand={requestCommand}
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
          onQueueCommand={requestCommand}
        />
      </>
    ),
    ai: (
      <>
        {commandQueue.length > 0 && (
          <div className="mb-4 rounded-2xl border border-status-caution/20 bg-status-caution/8 px-4 py-3 text-sm text-ink">
            <p className="font-medium">
              {commandQueue.length} action{commandQueue.length === 1 ? '' : 's'} in queue — approve from chat responses below.
            </p>
          </div>
        )}
        <RoboAgentAskPanel onQueueCommand={requestCommand} />
        <div className="mt-4 hidden lg:block">
          <AIRecommendationPanel
            recommendations={aiAnalysis.recommendations}
            isAnalyzing={isAnalyzing}
            onExecute={requestCommand}
          />
        </div>
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
          description="Capture telemetry, alerts, recommendations, and commands as future retrieval memory for ROBOAGENT AI."
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
          vehicle={primaryTesla}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
        />
      </>
    ),
    tesla: (
      <>
        <PageHeader
          eyebrow="Tesla Fleet API"
          title="Capabilities"
          description="See exactly which Tesla APIs ROBOAGENT uses today, which controls are safe to operate, and which commands should be added next."
          action={operationsStatus}
        />
        <TeslaCapabilitiesPanel
          vehicle={primaryTesla}
          syncStatus={realSyncStatus}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
          onShowMap={() => navigate('map')}
          onQueueCommand={requestCommand}
        />
      </>
    ),
    account: (
      <>
        <PageHeader
          eyebrow="Account"
          title="Account & Access"
          description="Manage your owner profile, plan, Tesla setup, and this device session."
        />
        <AccountPanel onNavigate={navigate} />
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
          vehicle={primaryTesla}
          isLoadingReal={isLoadingReal}
          onSync={refreshRealTesla}
          aiAnalysis={aiAnalysis}
          replayMode={replayMode}
          setReplayMode={setReplayMode}
        />
      </>
    ),
    admin: (
      <>
        <PageHeader
          eyebrow="Beta"
          title="Beta Admin"
          description="Review tester feedback and confirm whether beta storage is running on Postgres."
        />
        <BetaAdminPanel />
      </>
    ),
    privacy: (
      <>
        <PageHeader
          eyebrow="Privacy"
          title="Privacy Notice"
          description="Draft beta privacy language and data handling summary for ROBOAGENT testers."
        />
        <LegalPage type="privacy" />
      </>
    ),
    terms: (
      <>
        <PageHeader
          eyebrow="Terms"
          title="Beta Terms"
          description="Draft beta terms, safety boundaries, and Tesla relationship language."
        />
        <LegalPage type="terms" />
      </>
    ),
  };

  if (isPublicRoute) {
    return <LandingPage onNavigate={navigate} />;
  }

  if (isPublicAgentRoute) {
    return (
      <div className="robo-minimal">
        <AgentChatPage onNavigate={navigate} />
      </div>
    );
  }

  if (isPublicAboutRoute) {
    return (
      <div className="robo-minimal">
        <AgentAboutPage onNavigate={navigate} />
      </div>
    );
  }

  if (isPublicHowItWorksRoute) {
    return (
      <div className="robo-minimal">
        <HowItWorksPage onNavigate={navigate} />
      </div>
    );
  }

  if (isPublicLegalRoute) {
    return (
      <div className="robo-minimal min-h-screen bg-[#f7f7f5] px-5 py-6 text-[#141b27]">
        <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
          <button type="button" onClick={() => navigate('landing')} className="flex items-center gap-3">
            <RoboLogo className="h-8 w-8" />
            <RoboWordmark className="text-lg" />
          </button>
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="rounded-full border border-[#172231]/15 bg-white px-4 py-2 text-sm font-bold text-[#172231] shadow-sm transition hover:bg-slate-100"
          >
            Back to Home
          </button>
        </header>
        <LegalPage type={route} />
      </div>
    );
  }

  if (isPublicOnboardingRoute) {
    return (
      <div className="robo-minimal">
        <OnboardingPanel
          realVehicleCount={realVehicles.length}
          isLoading={isLoadingReal}
          onSync={refreshRealTesla}
          onNavigate={navigate}
        />
      </div>
    );
  }

  if (isPublicAccountRoute) {
    return (
      <div className="robo-minimal min-h-screen bg-[#f7f7f5] text-[#141b27]">
        <main>
          <AccountPanel onNavigate={navigate} />
        </main>
      </div>
    );
  }

  return (
    <div className="robo-minimal flex min-h-screen bg-[#f7f7f5] text-[#141b27]">
      <Sidebar
        commandQueue={commandQueue}
        route={route}
        onNavigate={navigate}
      />

      <main className="flex-1 overflow-y-auto bg-[#f7f7f5] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
        <div className="mx-auto max-w-[1900px]">
          <ErrorBoundary>
            {pages[route] || pages.overview}
          </ErrorBoundary>
        </div>
      </main>

      <MobileBottomNav route={route} onNavigate={navigate} pendingCount={commandQueue.length} />
      <CommandSafetyModal
        pendingCommand={pendingCommand}
        onCancel={() => setPendingCommand(null)}
        onConfirm={confirmCommand}
      />
      <FeedbackButton route={route} />
    </div>
  );
}
