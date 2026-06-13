import { useState } from 'react';
import { useUser } from '@clerk/react';
import { isClerkConfigured } from '../auth/clerkConfig';
import SignOutButton from '../components/SignOutButton';
import Logo from '../components/Logo';
import LiveDataPanel from './LiveDataPanel';
import FleetCommandHome from '../components/home/FleetCommandHome';
import {
  fleetInsightLine,
  lastSyncedLabel,
  vehicleStateLabel,
} from '../utils/vehicleDisplayUtils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function ClerkGreetingHeader() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.username || 'there';

  return (
    <>
      <h1 className="text-4xl lg:text-5xl font-semibold tracking-[-2px] mb-2">
        {getGreeting()}, {firstName}
      </h1>
      <p className="text-white/70 text-base lg:text-xl">Here's what's happening with your fleet today.</p>
    </>
  );
}

function GreetingHeader({ firstName = 'there' }) {
  return (
    <>
      <h1 className="text-4xl lg:text-5xl font-semibold tracking-[-2px] mb-2">
        {getGreeting()}, {firstName}
      </h1>
      <p className="text-white/70 text-base lg:text-xl">Here's what's happening with your fleet today.</p>
    </>
  );
}

function ConnectedVehicleCard({ realVehicles, lastSyncedAt, onNavigate }) {
  const single = realVehicles.length === 1 ? realVehicles[0] : null;
  const headerName = single
    ? (single.name || 'Your Tesla')
    : `${realVehicles.length} Teslas Connected`;
  const battery = single ? Number(single.battery) : NaN;
  const showBattery = Number.isFinite(battery);
  const statusWord = single
    ? vehicleStateLabel(single)
    : `${realVehicles.length} vehicle${realVehicles.length === 1 ? '' : 's'} synced`;
  const syncedLabel = lastSyncedLabel(lastSyncedAt, 'Synced');
  const insight = fleetInsightLine(realVehicles);

  const actions = [
    { label: 'View Fleet', route: 'fleet' },
    { label: 'Ask AI', route: 'ai' },
    { label: 'Alerts', route: 'alerts' },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5" role="status">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
          <p className="truncate text-base font-semibold text-white">{headerName}</p>
        </div>
        {showBattery && (
          <p className="flex-shrink-0 text-base font-semibold tabular-nums text-emerald-300">
            ⚡ {Math.round(battery)}%
          </p>
        )}
      </div>

      <p className="mt-1 pl-[22px] text-sm text-white/60">
        {statusWord}
        {syncedLabel ? ` · ${syncedLabel}` : ''}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-white/70">
        ROBOAGENT turns Tesla data into actionable insights so you know what needs attention and what can be optimized.
      </p>

      {insight && (
        <p className="mt-2 text-sm font-medium text-emerald-300">{insight}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {actions.map(({ label, route }) => (
          <button
            key={route}
            type="button"
            onClick={() => onNavigate(route)}
            className="min-h-[44px] rounded-xl border border-white/25 bg-white/10 px-2 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeslaSyncStatusBanner({ realSyncStatus, isLoadingReal, onRetrySync, onNavigate, realFleet = [], demoCount }) {
  if (!realSyncStatus) return null;

  const hasRealVehicles = realFleet.length > 0;
  const state = isLoadingReal ? 'loading' : realSyncStatus.state;
  const isBillingError = realSyncStatus.code === 'BILLING_REQUIRED' || realSyncStatus.httpStatus === 402;

  if (state === 'loading') {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-zinc-900 px-5 py-4" role="status">
        <span className="h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
        <p className="text-sm text-white/80">Connecting to Tesla...</p>
      </div>
    );
  }

  if (state === 'success') {
    if (hasRealVehicles) {
      return (
        <ConnectedVehicleCard
          realVehicles={realFleet}
          lastSyncedAt={realSyncStatus.lastSyncedAt}
          onNavigate={onNavigate}
        />
      );
    }
    // Success reported but no real vehicles in the fleet yet — keep the simple confirmation.
    const syncedLabel = lastSyncedLabel(realSyncStatus.lastSyncedAt);
    return (
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4" role="status">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
        <p className="text-sm font-medium text-emerald-300">Tesla connected successfully</p>
        {syncedLabel && <p className="text-sm text-white/60">{syncedLabel}</p>}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4" role="alert">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-300">
              {isBillingError
                ? 'Additional Tesla vehicles require an upgraded AutoFleeto plan.'
                : 'Tesla connected but vehicle sync failed'}
            </p>
            {realSyncStatus.message && (
              <p className="mt-1 text-sm text-white/60">{realSyncStatus.message}</p>
            )}
            {!hasRealVehicles && demoCount > 0 && (
              <p className="mt-1 text-sm text-white/60">
                No Tesla vehicles are currently connected. Demo vehicles are shown below.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {isBillingError && (
                <button
                  type="button"
                  onClick={() => onNavigate('account')}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  View Plans
                </button>
              )}
              <button
                type="button"
                onClick={onRetrySync}
                className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Retry Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // idle — sync has not been attempted yet (e.g. telemetry consent missing)
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-zinc-900 px-5 py-4" role="status">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-white/40" aria-hidden="true" />
        <p className="text-sm text-white/70">Tesla telemetry has not synced yet.</p>
      </div>
      <button
        type="button"
        onClick={onRetrySync}
        className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Sync now
      </button>
    </div>
  );
}

export default function CommandDashboard({
  onNavigate = () => {},
  route = 'overview',
  fleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  onRetrySync = () => {},
  commandQueue = [],
  onQueueCommand = () => {},
}) {
  const totalVehicles = fleet.length;
  const onlineVehicles = fleet.filter(v => {
    const s = (v.status || '').toUpperCase();
    return !s.includes('OFFLINE');
  }).length || totalVehicles;

  // Financial KPIs only count real Tesla vehicles — demo/simulated vehicles are excluded.
  const realFleet = fleet.filter(v => v.isReal);
  const demoCount = fleet.length - realFleet.length;
  const totalEarnings = realFleet.reduce((sum, v) => sum + (v.revenue || 0), 0);

  const formatDollars = (amount) => {
    const num = Math.round(amount || 0);
    return '$' + num.toLocaleString();
  };

  // Sidebar nav items
  const navItems = [
    { label: "Home", route: 'overview' },
    { label: "Map", route: 'map' },
    { label: "Fleet", route: 'fleet' },
    { label: "Add Vehicle", route: 'add-vehicle' },
    { label: "AI Agent", route: 'ai' },
    { label: "Finance", route: 'finance' },
    { label: "Charging", route: 'charging' },
    { label: "Settings", route: 'settings' },
  ];

  const isActive = (itemRoute) => {
    if (itemRoute === 'overview' && (route === 'overview' || !route)) return true;
    return route === itemRoute;
  };

  const handleNavClick = (itemRoute) => {
    onNavigate(itemRoute);
  };

  const [publicTrackerData, setPublicTrackerData] = useState(null);
  const [publicTrackerLoading, setPublicTrackerLoading] = useState(false);

  const loadPublicTracker = async () => {
    setPublicTrackerLoading(true);
    try {
      const res = await fetch('/api/public-tracker?provider=tesla&area=austin');
      const data = await res.json();
      setPublicTrackerData(data);
    } catch (e) {
      setPublicTrackerData({ error: 'Failed to load public tracker data', details: e.message });
    } finally {
      setPublicTrackerLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Left Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex w-72 border-r border-white/10 bg-[#0a0a0a] flex-shrink-0 flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center mb-10">
            <Logo className="h-8" onClick={() => onNavigate('overview')} />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => handleNavClick(item.route)}
                className={`px-5 py-3.5 rounded-2xl text-lg font-medium cursor-pointer transition ${
                  isActive(item.route) ? 'bg-white text-black' : 'hover:bg-white/5'
                }`}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* Sign out button at bottom of sidebar */}
        <div className="p-6 border-t border-white/10">
          <SignOutButton
            onSignedOut={() => onNavigate('landing')}
            className="w-full text-left text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-2xl px-5 py-3 transition"
            label="Sign out"
            compact
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-24 lg:p-12 lg:pb-12">
        {/* Mobile Home — Fleet Command Center (Phase 1) */}
        <div className="lg:hidden bg-[#f3f4f8]">
          <FleetCommandHome
            fleet={fleet}
            realFleet={realFleet}
            realSyncStatus={realSyncStatus}
            isLoadingReal={isLoadingReal}
            onRetrySync={onRetrySync}
            onNavigate={onNavigate}
          />
        </div>

        {/* Desktop dashboard — unchanged */}
        <div className="hidden lg:block p-5 max-w-screen-2xl mx-auto">
          {/* Greeting — useUser only when ClerkProvider is active (local dev without API key) */}
          {isClerkConfigured() ? <ClerkGreetingHeader /> : <GreetingHeader />}

          {/* Tesla sync status — the user should never have to open Settings to learn sync failed */}
          <TeslaSyncStatusBanner
            realSyncStatus={realSyncStatus}
            isLoadingReal={isLoadingReal}
            onRetrySync={onRetrySync}
            onNavigate={onNavigate}
            realFleet={realFleet}
            demoCount={demoCount}
          />

          {/* KPI Cards — horizontal scroll on mobile, 4-col grid on lg */}
          <div className="mt-8 lg:mt-10">
            <div className="flex lg:grid lg:grid-cols-4 gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 lg:mx-0 lg:px-0 scrollbar-none">
              <div className="bg-zinc-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex-shrink-0 snap-start w-[72vw] sm:w-[48vw] lg:w-auto">
                <div className="text-emerald-400 text-xs lg:text-sm font-medium tracking-widest">TODAY'S EARNINGS</div>
                <div className="text-4xl lg:text-5xl font-semibold mt-3 tabular-nums">
                  {formatDollars(totalEarnings)}
                </div>
                <div className="text-white/40 text-xs mt-2">
                  {realFleet.length > 0 ? 'Real Tesla vehicles only' : 'Connect a Tesla to track earnings'}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex-shrink-0 snap-start w-[72vw] sm:w-[48vw] lg:w-auto">
                <div className="text-emerald-400 text-xs lg:text-sm font-medium tracking-widest">VEHICLES ONLINE</div>
                <div className="text-4xl lg:text-5xl font-semibold mt-3 tabular-nums">
                  {onlineVehicles}/{totalVehicles}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex-shrink-0 snap-start w-[72vw] sm:w-[48vw] lg:w-auto">
                <div className="text-emerald-400 text-xs lg:text-sm font-medium tracking-widest">AVG BATTERY</div>
                <div className="text-4xl lg:text-5xl font-semibold mt-3 tabular-nums">
                  {fleet.length > 0
                    ? Math.round(fleet.reduce((sum, v) => sum + (v.battery || v.battery_level || 0), 0) / fleet.length)
                    : 0}%
                </div>
              </div>
              <div className="bg-zinc-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex-shrink-0 snap-start w-[72vw] sm:w-[48vw] lg:w-auto">
                <div className="text-emerald-400 text-xs lg:text-sm font-medium tracking-widest">AI ACTIONS</div>
                <div className="text-4xl lg:text-5xl font-semibold mt-3 tabular-nums">3</div>
              </div>
            </div>
          </div>

          {/* AI Bar — launcher for the AI panel (the panel owns the real input) */}
          <div className="mt-8 lg:mt-12 bg-zinc-900 rounded-2xl lg:rounded-3xl p-2">
            <button
              type="button"
              onClick={() => onNavigate('ai')}
              aria-label="Open the AI fleet assistant"
              className="w-full flex items-center gap-3 bg-[#0a0a0a] rounded-xl lg:rounded-3xl px-4 lg:px-6 py-3.5 lg:py-5 text-left transition hover:bg-zinc-950"
            >
              <div className="text-emerald-400 flex-shrink-0">✦</div>
              <span className="flex-1 text-base lg:text-lg text-white/40">Ask anything about your fleet…</span>
              <span className="flex-shrink-0 bg-white text-black px-5 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-medium text-sm lg:text-base">
                Ask AI
              </span>
            </button>
          </div>

          {/* Live Data Overview - Charts & Stats */}
          <div className="mt-12">
            <LiveDataPanel fleet={fleet} />
          </div>

          {/* Public Tracker Integration (example calling external robotaxi data) */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Public Live Tracker</h2>
            <div className="bg-zinc-900 rounded-3xl p-6">
              <p className="text-white/70 mb-4">Example integration: Public real-time Tesla robotaxi sightings (Austin area via community trackers like robotaxitracker.com). Data is fetched server-side via our /api to avoid CORS.</p>

              <button
                onClick={loadPublicTracker}
                disabled={publicTrackerLoading}
                className="px-6 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-white/90 active:scale-[0.985] transition disabled:opacity-50"
              >
                {publicTrackerLoading ? 'Loading...' : 'Load Austin Tesla Tracker Data'}
              </button>

              {publicTrackerData && (
                <div className="mt-6 p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 text-sm">
                  {publicTrackerData.error ? (
                    <div className="text-red-400">Error: {publicTrackerData.error} — {publicTrackerData.details}</div>
                  ) : (
                    <>
                      <div className="font-mono text-emerald-400">{publicTrackerData.title}</div>
                      <div className="mt-1 text-white/70">{publicTrackerData.note}</div>
                      {publicTrackerData.vehicleHint && (
                        <div className="mt-2 text-white/80">Hint: ~{publicTrackerData.vehicleHint}</div>
                      )}
                      <a href={publicTrackerData.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-emerald-400 hover:underline">Open full interactive map on robotaxitracker.com →</a>
                      <div className="mt-2 text-[10px] text-white/40">Fetched at {publicTrackerData.fetchedAt}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fleet Cards - show all vehicles */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-2">Your Fleet</h2>
            {demoCount > 0 && (
              <p className="text-white/50 text-sm mb-6">
                Includes {demoCount} demo vehicle{demoCount === 1 ? '' : 's'} for preview — demo data is excluded from earnings.
              </p>
            )}
            {demoCount === 0 && <div className="mb-6" />}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fleet.length > 0 ? (
                fleet.map((vehicle, i) => {
                  const name = vehicle.display_name || vehicle.id || `Vehicle-${i + 1}`;
                  const battery = Math.round(vehicle.battery || vehicle.battery_level || 0);
                  const earnings = Math.round(vehicle.revenue || 0);

                  // Derive a simple status label + color
                  const rawStatus = (vehicle.status || '').toUpperCase();
                  let statusText = 'ONLINE';
                  let statusColor = 'text-emerald-400';

                  if (rawStatus.includes('CHARGE') || battery < 25) {
                    statusText = 'CHARGING';
                    statusColor = 'text-amber-400';
                  } else if (rawStatus.includes('SERVICE') || rawStatus.includes('PICK') || rawStatus.includes('REPOS')) {
                    statusText = 'IN SERVICE';
                    statusColor = 'text-emerald-400';
                  }

                  return (
                    <div 
                      key={vehicle.id || i} 
                      onClick={() => onNavigate('fleet')}
                      className="group bg-zinc-900 rounded-3xl p-8 hover:bg-zinc-800 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-emerald-500/10 border border-transparent hover:border-white/20 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-xl tracking-tight">{name}</div>
                            {!vehicle.isReal && (
                              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white/60">
                                DEMO
                              </span>
                            )}
                          </div>
                          <div className={`inline-flex items-center gap-1.5 text-sm mt-2 ${statusColor}`}>
                            ● {statusText}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-5xl font-semibold tabular-nums">{battery}<span className="text-base align-super">%</span></div>
                        </div>
                      </div>

                      <div className="mt-10 flex justify-between items-end">
                        <div>
                          <div className="text-3xl font-medium">{formatDollars(earnings)}</div>
                          <div className="text-white/60 text-sm">{vehicle.isReal ? 'today' : 'demo data'}</div>
                        </div>
                        <div className="text-xs text-white/40">Tap for details</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-white/60">No vehicles yet. Connect your first Tesla.</div>
              )}
            </div>
          </div>

          {/* Add Another Vehicle */}
          <div className="mt-8">
            <button
              onClick={() => onNavigate('add-vehicle')}
              className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/30 hover:bg-white/20 px-6 py-4 rounded-2xl text-lg font-medium transition"
            >
              <span className="text-2xl">+</span>
              Add Another Tesla / Cybercab
            </button>
            <p className="text-center text-white/50 text-sm mt-3">
              Tesla allows multiple vehicles under one account. You'll go through the same secure OAuth flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
