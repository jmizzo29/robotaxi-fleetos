import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthenticateWithRedirectCallback, ClerkProvider } from '@clerk/react';
import CommandSafetyModal from './components/CommandSafetyModal';
import FeedbackButton from './components/FeedbackButton';
import PageHeader from './components/PageHeader';
import { AppHeader, AppShell } from './components/shell';
import { colors, mobileScreenBadge } from './design/roboagentTokens';
import RoboLogo from './components/RoboLogo';
import RoboWordmark from './components/RoboWordmark';
import Logo from './components/Logo';
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
import LandingPage, { AgentChatPage, HowItWorksPage } from './panels/LandingPage';
import AboutMonument from './components/landing/AboutMonument';
import LegalMonument from './components/landing/LegalMonument';
import Landing from './pages/Landing';
import LandingEntry from './pages/LandingEntry';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import LegalPage from './panels/LegalPage';
import MemoryEventsPanel from './panels/MemoryEventsPanel';
import { MonumentChainShell, MonumentOperations } from './components/monument';
import OnboardingPanel from './panels/OnboardingPanel';
import AddVehiclePanel from './panels/AddVehiclePanel';
import OperationsReportPanel from './panels/OperationsReportPanel';
import RoboAgentAskPanel from './panels/RoboAgentAskPanel';
import SettingsPanel from './panels/SettingsPanel';
import TeslaCapabilitiesPanel from './panels/TeslaCapabilitiesPanel';
import VehicleDetailPanel from './panels/VehicleDetailPanel';
import DeleteAccountButton from './components/DeleteAccountButton';
import chargingStations from './data/chargingStations';
import demandZones from './data/demandZones';
import weatherZones from './data/weatherZones';
import useAiFleetAnalysis from './hooks/useAiFleetAnalysis';
import useHashRoute from './hooks/useHashRoute';
import { useFleetSimulation } from './hooks/useFleetSimulation';
import { useFleetAuthStatus } from './auth/FleetAuthContext';
import { canUseTeslaTelemetry } from './services/betaCompliance';
import { getFleetOsSession } from './services/sessionService';
import { sendTeslaChargingCommand } from './services/teslaChargingService';
import { routeToOperationsTab } from './utils/operationsUtils';

const OPERATIONS_ROUTES = new Set(['dispatch', 'charging', 'health', 'readiness', 'alerts']);
const MONUMENT_UTILITY_ROUTES = new Set(['map', 'network', 'integrations', 'settings']);
const MONUMENT_CHAIN_ROUTES = new Set(['overview', ...MONUMENT_UTILITY_ROUTES]);
const TESLA_CONNECT_ENTRY_ROUTES = new Set([
  'landing',
  'landing-entry',
  'login',
  'signup',
  'signup-email',
  'onboarding',
  'add-vehicle',
]);

const FleetMap = lazy(() => import('./components/FleetMap'));
const NetworkPanel = lazy(() => import('./panels/NetworkPanel'));

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

export function SsoCallbackPage({ onNavigate }) {
  useEffect(() => {
    // Immediate redirect back into the app. No interstitial screen.
    // We want the user to land directly in the authenticated experience after Tesla/Clerk auth.
    const timer = setTimeout(() => {
      if (onNavigate) {
        onNavigate('overview');
      } else {
        window.location.hash = '#overview';
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  // Render nothing (or an extremely minimal loader) so the transition feels automatic.
  // The Clerk AuthenticateWithRedirectCallback above us handles the session establishment.
  return (
    <div className="min-h-screen bg-[#1C1D21] text-white flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Returning to app...
      </div>
    </div>
  );
}

// Email sign-up is disabled during beta. Tesla OAuth is the only authentication method,
// so this route now points users to the Tesla-first signup screen instead of a fake form.
function EmailSignupFlow({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#1C1D21] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center mb-12">
          <Logo className="h-10" onClick={() => onNavigate('landing')} />
        </div>

        <h1 className="text-5xl font-semibold tracking-[-2px] mb-4">Email sign-up is coming soon</h1>
        <p className="text-2xl text-white/70 mb-10">
          During beta, accounts are created with your Tesla account. It's the fastest and most secure way to connect your fleet.
        </p>

        <button
          onClick={() => onNavigate('signup')}
          className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition"
        >
          Continue with Tesla Account
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [route] = useHashRoute();

  if (window.location.pathname === '/sso-callback' || route === 'sso-callback') {
    return (
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <AuthenticateWithRedirectCallback />
        <SsoCallbackPage />
      </ClerkProvider>
    );
  }

  return <FleetApp />;
}

function FleetApp() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [commandBusy, setCommandBusy] = useState(false);
  const [, setComplianceRevision] = useState(0);
  const [route, navigate] = useHashRoute();
  const isPublicRoute = route === 'landing';
  const isPublicLandingEntryRoute = route === 'landing-entry';
  const isPublicLandingOnly = isPublicRoute || isPublicLandingEntryRoute;
  const isPublicLoginRoute = route === 'login';
  const isPublicSignupRoute = route === 'signup';
  const isPublicSignupEmailRoute = route === 'signup-email';
  const isPublicAgentRoute = route === 'agent';
  const isPublicAboutRoute = route === 'about';
  const isPublicHowItWorksRoute = route === 'how-it-works';
  const isPublicLegalRoute = route === 'privacy' || route === 'terms';
  const isPublicOnboardingRoute = route === 'onboarding';
  const isPublicAddVehicleRoute = route === 'add-vehicle';
  const isPublicAccountRoute = route === 'account';
  const shouldRestoreTeslaLaunchRoute = TESLA_CONNECT_ENTRY_ROUTES.has(route);
  const teslaConsentReady = canUseTeslaTelemetry();
  const shouldAutoSyncReal = !(
    isPublicRoute ||
    isPublicLandingEntryRoute ||
    isPublicLoginRoute ||
    isPublicSignupRoute ||
    isPublicSignupEmailRoute ||
    isPublicAgentRoute ||
    isPublicAboutRoute ||
    isPublicHowItWorksRoute ||
    isPublicLegalRoute ||
    isPublicOnboardingRoute ||
    isPublicAddVehicleRoute ||
    isPublicAccountRoute
  );
  // Every non-public route requires an authenticated session.
  const isProtectedRoute = shouldAutoSyncReal;

  useEffect(() => {
    const refreshCompliance = () => setComplianceRevision((current) => current + 1);
    window.addEventListener('fleetos-compliance-updated', refreshCompliance);
    return () => window.removeEventListener('fleetos-compliance-updated', refreshCompliance);
  }, []);

  // === AUTH ROUTE GUARD ===
  // Verify an active session before rendering protected pages. Logged-out users
  // who type #/overview etc. are redirected to the landing page.
  const { isAuthReady, isSignedIn } = useFleetAuthStatus();
  const [sessionCheck, setSessionCheck] = useState('checking'); // 'checking' | 'authed' | 'guest'
  const [startupTeslaRestore, setStartupTeslaRestore] = useState({ route: null, status: 'idle' });
  // Clerk-signed-in users are authenticated without a server round trip.
  const sessionAllowed = isSignedIn || sessionCheck === 'authed';

  useEffect(() => {
    if (!shouldRestoreTeslaLaunchRoute) return undefined;
    if (!isAuthReady) return undefined;

    let cancelled = false;

    async function restoreTeslaSession() {
      await Promise.resolve();
      if (cancelled) return;
      setStartupTeslaRestore({ route, status: 'checking' });

      try {
        const session = await getFleetOsSession();
        if (cancelled) return;
        if (session?.authenticated && session?.teslaConnected) {
          setSessionCheck('authed');
          navigate('overview');
          return;
        }
      } catch {
        // If the session endpoint is unavailable, leave the connect route usable.
      }

      if (!cancelled) setStartupTeslaRestore({ route, status: 'done' });
    }

    restoreTeslaSession();

    return () => {
      cancelled = true;
    };
    // navigate sets window.location.hash; it is intentionally omitted to avoid
    // repeating the startup session probe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRestoreTeslaLaunchRoute, isAuthReady, route]);

  useEffect(() => {
    if (!isProtectedRoute || !isAuthReady || isSignedIn) return undefined;
    let cancelled = false;
    // Reset a stale 'guest' verdict to 'checking' so a user who just completed
    // Tesla OAuth is not bounced to landing before the fresh check resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionCheck((current) => (current === 'authed' ? current : 'checking'));
    getFleetOsSession()
      .then((session) => {
        if (!cancelled) setSessionCheck(session?.authenticated ? 'authed' : 'guest');
      })
      .catch((error) => {
        if (cancelled) return;
        // Only an explicit 401 proves the user is signed out. Network or server
        // hiccups fail open so flaky connections don't eject signed-in users.
        setSessionCheck(error.status === 401 ? 'guest' : 'authed');
      });
    return () => {
      cancelled = true;
    };
  }, [isProtectedRoute, isAuthReady, isSignedIn, route]);

  useEffect(() => {
    if (isProtectedRoute && !isSignedIn && sessionCheck === 'guest') {
      navigate('landing');
    }
    // navigate is stable in behavior (sets window.location.hash); intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProtectedRoute, isSignedIn, sessionCheck]);

  const {
    fleet,
    timelineEvents,
    replayMode,
    setReplayMode,
    commandQueue,
    enqueueCommand,
    refreshRealTesla,
    disconnectRealTesla,
    isLoadingReal,
    realSyncStatus,
  } = useFleetSimulation({
    initialFleet,
    chargingStations,
    replayModeInitial: false,
    autoSyncReal: shouldAutoSyncReal,
    canSyncReal: teslaConsentReady,
    syncOwnership: !isPublicLandingOnly,
  });

  const totalRevenue = useMemo(
    () => fleet.reduce((sum, vehicle) => (vehicle.isReal ? sum + (vehicle.revenue || 0) : sum), 0),
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
    enabled: !isPublicLandingOnly,
  });
  const requestCommand = (command, priority = 'NORMAL', extras = {}) => {
    setPendingCommand({
      command,
      priority,
      requestedAt: new Date().toISOString(),
      ...extras,
    });
  };

  const confirmCommand = async () => {
    if (!pendingCommand) return;
    if (pendingCommand.teslaAction) {
      setCommandBusy(true);
      try {
        await sendTeslaChargingCommand(pendingCommand.teslaAction);
      } catch (error) {
        setPendingCommand((current) => (
          current ? { ...current, error: error.message || 'Tesla rejected the charging command.' } : current
        ));
        setCommandBusy(false);
        return;
      }
      setCommandBusy(false);
    }
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
    <div className="w-full border border-[rgba(91,168,160,0.18)] bg-[#25262B] p-4 sm:min-w-[280px] sm:w-auto sm:p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8B8E94]">
        Operations Status
      </p>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-[#8B8E94]">Active Vehicles</span>
          <span className="font-medium text-[#F3F3F1]">{fleet.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#8B8E94]">Real Tesla</span>
          <span className="font-medium text-[#F3F3F1]">{realVehicles.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#8B8E94]">Simulation Fleet</span>
          <span className="font-medium text-[#F3F3F1]">{simulatedVehicles.length}</span>
        </div>

        <button
          onClick={refreshRealTesla}
          disabled={isLoadingReal}
          className="w-full rounded-full bg-white px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0E0F12] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoadingReal ? 'Syncing Tesla...' : 'Sync Tesla Telemetry'}
        </button>
      </div>
    </div>
  );

  const pages = {
    overview: (
      <MonumentChainShell
        route="overview"
        fleet={fleet}
        realFleet={realVehicles}
        realSyncStatus={realSyncStatus}
        isLoadingReal={isLoadingReal}
        commandQueue={commandQueue}
        aiAnalysis={aiAnalysis}
        onQueueCommand={enqueueCommand}
        onNavigate={navigate}
        onSync={refreshRealTesla}
        onDisconnect={disconnectRealTesla}
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
          <div className="flex h-[70vh] min-h-[460px] items-center justify-center border border-[rgba(91,168,160,0.18)] bg-[#25262B] text-sm font-medium text-[#8B8E94] lg:h-[calc(100vh-8rem)]">
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
      <FleetHealthDashboard
        fleet={fleet}
        onQueueCommand={requestCommand}
      />
    ),
    charging: (
      <ChargingReadinessPanel
        fleet={fleet}
        onQueueCommand={requestCommand}
      />
    ),
    dispatch: (
      <DispatchPlannerPanel
        fleet={fleet}
        demandZones={demandZones}
        chargingStations={chargingStations}
        onQueueCommand={requestCommand}
        onShowMap={() => navigate('map')}
      />
    ),
    readiness: (
      <DriverlessReadinessPanel
        fleet={fleet}
        onQueueCommand={requestCommand}
      />
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
        <IntelligentAlertCenter analysis={aiAnalysis} isAnalyzing={isAnalyzing} />
        <div className="hidden lg:block">
          <Timeline timelineEvents={combinedTimeline} replayMode={replayMode} />
        </div>
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
        <AccountPanel onNavigate={navigate} embedded />
      </>
    ),
    settings: (
      <SettingsPanel
        realSyncStatus={realSyncStatus}
        vehicle={primaryTesla}
        isLoadingReal={isLoadingReal}
        onSync={refreshRealTesla}
        aiAnalysis={aiAnalysis}
        replayMode={replayMode}
        setReplayMode={setReplayMode}
      />
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

  // === PUBLIC ROUTES (Landing, Login, Signup) ===
  if (isPublicLandingOnly && !isAuthReady) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.canvas, backgroundImage: colors.canvasWash }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#8B8E94' }} />
          <p className="text-sm" style={{ color: '#8B8E94' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const isRestoringTeslaSession = (
    shouldRestoreTeslaLaunchRoute &&
    (!isAuthReady || startupTeslaRestore.route !== route || startupTeslaRestore.status === 'checking')
  );
  const isMockPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('mock');
  const hideFloatingDeleteAccount = isMockPreview || route === 'fleet';

  if (isRestoringTeslaSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1D21] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          <p className="text-sm text-white/60">Checking your Tesla connection...</p>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <Landing onNavigate={navigate} />;
  }

  if (isPublicLandingEntryRoute) {
    return <LandingEntry onNavigate={navigate} />;
  }

  if (isPublicLoginRoute) {
    return <Login onNavigate={navigate} />;
  }

  if (isPublicSignupRoute) {
    return <Signup onNavigate={navigate} />;
  }

  if (isPublicSignupEmailRoute) {
    // Email sign-up is disabled during beta; this route points users to Tesla OAuth.
    return <EmailSignupFlow onNavigate={navigate} />;
  }

  if (isPublicAgentRoute) {
    return (
      <div className="robo-minimal">
        <AgentChatPage onNavigate={navigate} />
      </div>
    );
  }

  if (isPublicAboutRoute) {
    return <AboutMonument onNavigate={navigate} />;
  }

  if (isPublicHowItWorksRoute) {
    return <HowItWorksPage onNavigate={navigate} />;
  }

  if (isPublicLegalRoute) {
    return <LegalMonument type={route} onNavigate={navigate} />;
  }

  if (isPublicOnboardingRoute) {
    return (
      <OnboardingPanel
        realVehicleCount={realVehicles.length}
        isLoading={isLoadingReal}
        onSync={refreshRealTesla}
        onNavigate={navigate}
      />
    );
  }

  if (isPublicAddVehicleRoute) {
    return <AddVehiclePanel onNavigate={navigate} />;
  }

  if (isPublicAccountRoute) {
    return (
      <>
        <div className="lg:hidden">
          <AppShell>
            <AppHeader badge="Account" />
            <AccountPanel embedded onNavigate={navigate} />
          </AppShell>
        </div>
        <div className="hidden min-h-screen bg-[#1C1D21] text-[#F3F3F1] lg:block">
          <AccountPanel onNavigate={navigate} />
        </div>
        <FeedbackButton route={route} />
      </>
    );
  }

  // === AUTH ROUTE GUARD ===
  // All routes below are protected. Block rendering until the session check
  // passes; guests are redirected to #/landing by the guard effect above.
  if (!sessionAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1D21] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          <p className="text-sm text-white/60">Checking your session...</p>
        </div>
      </div>
    );
  }

  // New premium dark dashboard (matches Landing + Auth + Onboarding style)
  // Includes its own clean sidebar for the full dark experience
  if (MONUMENT_CHAIN_ROUTES.has(route)) {
    return (
      <>
        <div className="flex h-screen min-h-0" style={{ backgroundColor: colors.canvas, backgroundImage: colors.canvasWash }}>
          <Sidebar commandQueue={commandQueue} route={route} onNavigate={navigate} />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MonumentChainShell
              route={route}
              fleet={fleet}
              realFleet={realVehicles}
              realSyncStatus={realSyncStatus}
              isLoadingReal={isLoadingReal}
              commandQueue={commandQueue}
              aiAnalysis={aiAnalysis}
              onQueueCommand={enqueueCommand}
              onNavigate={navigate}
              onSync={refreshRealTesla}
              onDisconnect={disconnectRealTesla}
            />
          </main>
        </div>
        <FeedbackButton route={route} />
      </>
    );
  }

  if (OPERATIONS_ROUTES.has(route)) {
    return (
      <>
        <div className="flex h-screen min-h-0" style={{ backgroundColor: colors.canvas, backgroundImage: colors.canvasWash }}>
          <Sidebar commandQueue={commandQueue} route={route} onNavigate={navigate} />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MonumentOperations
              fleet={fleet}
              realFleet={realVehicles}
              realSyncStatus={realSyncStatus}
              isLoadingReal={isLoadingReal}
              commandQueue={commandQueue}
              onQueueCommand={enqueueCommand}
              onNavigate={navigate}
              initialTab={routeToOperationsTab(route)}
              onDisconnect={disconnectRealTesla}
              route={route}
            />
          </main>
        </div>
        <FeedbackButton route={route} />
      </>
    );
  }

  return (
    <div className="robo-minimal flex min-h-screen text-[#F3F3F1] lg:bg-[#1C1D21]">
      <Sidebar
        commandQueue={commandQueue}
        route={route}
        onNavigate={navigate}
      />

      <main className="flex-1 overflow-y-auto lg:bg-[#1C1D21] lg:p-8">
        <div className="mx-auto max-w-[1900px]">
          <div className="lg:hidden">
            <AppShell>
              <AppHeader badge={mobileScreenBadge(route)} />
              <ErrorBoundary>
                {pages[route] || pages.overview}
              </ErrorBoundary>
            </AppShell>
          </div>
          <div className="hidden p-4 sm:p-6 lg:block">
            <ErrorBoundary>
              {pages[route] || pages.overview}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <CommandSafetyModal
        pendingCommand={pendingCommand}
        confirming={commandBusy}
        onCancel={() => setPendingCommand(null)}
        onConfirm={confirmCommand}
      />
      <FeedbackButton route={route} />
      {!hideFloatingDeleteAccount && <DeleteAccountButton />}
    </div>
  );
}
