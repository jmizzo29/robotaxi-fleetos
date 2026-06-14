import { useCallback, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import AssetDetailSheet from './AssetDetailSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import ExploreMarketSheet from './ExploreMarketSheet';
import FleetMonumentPanel from './FleetMonumentPanel';
import MonumentSwipeStrip from './MonumentSwipeStrip';
import MonumentUtilityLinks from './MonumentUtilityLinks';
import MonumentActionFooter from './MonumentActionFooter';
import TelemetryDetailSheet from './TelemetryDetailSheet';
import FleetBrowseSheet from './FleetBrowseSheet';
import TodayDetailSheet from './TodayDetailSheet';
import { monument, monumentType } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import {
  findVehicleByCab,
  getAccountSheetPayload,
  getAssetSheetPayload,
  getGrowSheetPayload,
  getMonumentAction,
  getMonumentTake,
  getTodayDetailPayload,
  getTopEarner,
  isTeslaConnected,
} from '../../utils/monumentUtils';
import { getTelemetryFocusTarget, getTelemetrySheetPayload } from '../../utils/telemetryUtils';
import { getCommandFleetStatusStrip } from '../../utils/vehicleDisplayUtils';
import { getExpansionRecommendation } from '../../utils/networkIntelligenceUtils';

const TAB_ORDER = ['today', 'fleet', 'grow'];

function MonumentHero({ label, amount, subline, labelColor, onTapAmount }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className={monumentType.label} style={{ color: labelColor || monument.inkGhost }}>{label}</p>
      <button
        type="button"
        onClick={onTapAmount}
        className={`mt-5 ${monumentType.monument}`}
        style={{ color: monument.money }}
      >
        {amount}
      </button>
      <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{subline}</p>
    </div>
  );
}

export default function MonumentToday({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  onQueueCommand = () => {},
  onNavigate = () => {},
  onSync = () => {},
  onDisconnect = null,
}) {
  const { user } = useUser();
  const [tab, setTab] = useState('today');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [staging, setStaging] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const [growCity, setGrowCity] = useState('Tampa');
  const [assetTarget, setAssetTarget] = useState(null);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [telemetryTarget, setTelemetryTarget] = useState(null);
  const [fleetBrowseOpen, setFleetBrowseOpen] = useState(false);
  const [fleetBrowseKey, setFleetBrowseKey] = useState('active');
  const pagerRef = useRef(null);
  const scrollRaf = useRef(null);

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const take = useMemo(
    () => getMonumentTake(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const action = useMemo(
    () => getMonumentAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings),
    [fleet, realFleet, realSyncStatus, commandQueue, totalEarnings],
  );

  const strip = useMemo(
    () => getCommandFleetStatusStrip(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const expansion = useMemo(() => getExpansionRecommendation(fleet), [fleet]);

  const fleetCity = useMemo(() => {
    const city = fleet.find((vehicle) => vehicle.city)?.city;
    return city ? String(city).split(',')[0].trim() : 'Orlando';
  }, [fleet]);

  const assetPayload = useMemo(
    () => getAssetSheetPayload(fleet, realFleet, totalEarnings, syncState, assetTarget),
    [fleet, realFleet, totalEarnings, syncState, assetTarget],
  );

  const growPayload = useMemo(
    () => getGrowSheetPayload(fleet, growCity),
    [fleet, growCity],
  );

  const todayPayload = useMemo(
    () => getTodayDetailPayload(fleet, realFleet, totalEarnings, syncState, take.amount),
    [fleet, realFleet, totalEarnings, syncState, take.amount],
  );

  const accountPayload = useMemo(
    () => getAccountSheetPayload({
      userName: user?.fullName || user?.firstName || 'ROBOAGENT Owner',
      fleet,
      realFleet,
      realSyncStatus,
    }),
    [user, fleet, realFleet, realSyncStatus],
  );

  const actionLine = actionDone || action.line.replace(/\.$/, '');
  const offline = Number(strip.offline?.value) || 0;
  const fleetSyncHint = realFleet.length === 0 && realSyncStatus?.state === 'error'
    ? realSyncStatus.message
    : realFleet.length === 0 && !isLoadingReal
      ? 'Tesla connected? Sync from Settings to load your vehicle.'
      : null;

  const scrollToTab = useCallback((nextTab) => {
    const index = TAB_ORDER.indexOf(nextTab);
    const el = pagerRef.current;
    if (!el || index < 0) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setTab(nextTab);
  }, []);

  const handlePagerScroll = useCallback(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const el = pagerRef.current;
      if (!el || el.clientWidth === 0) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      const next = TAB_ORDER[Math.min(TAB_ORDER.length - 1, Math.max(0, index))];
      setTab((current) => (current === next ? current : next));
    });
  }, []);

  const openAssetSheet = (target = null) => {
    setAssetTarget(target || getTopEarner(fleet, realFleet, totalEarnings, syncState));
    setAssetOpen(true);
  };

  const openTelemetrySheet = (preferredCab = null) => {
    const target = getTelemetryFocusTarget(
      fleet,
      realFleet,
      totalEarnings,
      syncState,
      preferredCab || action.secondary?.cab,
    );
    if (!target?.vehicle) return;
    setTelemetryTarget(target);
    setTelemetryOpen(true);
  };

  const handleFleetStatusSelect = (tileKey) => {
    setFleetBrowseKey(tileKey);
    setFleetBrowseOpen(true);
  };

  const telemetryPayload = useMemo(
    () => getTelemetrySheetPayload(telemetryTarget?.vehicle, telemetryTarget?.cab, realSyncStatus),
    [telemetryTarget, realSyncStatus],
  );

  const handleHeroTap = (pageId) => {
    if (pageId === 'grow') {
      setGrowCity('Tampa');
      setExploreOpen(true);
      return;
    }
    setTodayOpen(true);
  };

  const handleDoIt = (pageId) => {
    if (pageId === 'grow') {
      setGrowCity('Tampa');
      setExploreOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const { confirm } = action;
    setConfirming(true);
    try {
      onQueueCommand(confirm.command, confirm.priority);
      setActionDone('Charge plan queued.');
      setConfirmOpen(false);
      window.setTimeout(() => setActionDone(''), 4000);
    } finally {
      setConfirming(false);
    }
  };

  const handleNudgeRoute = async () => {
    if (!assetPayload?.nudgeCommand) return;
    setNudging(true);
    try {
      onQueueCommand(assetPayload.nudgeCommand, 'NORMAL');
      setAssetOpen(false);
      setActionDone('Route nudge queued.');
      window.setTimeout(() => setActionDone(''), 4000);
    } finally {
      setNudging(false);
    }
  };

  const handleStagePlan = async () => {
    if (!growPayload?.command) return;
    setStaging(true);
    try {
      onQueueCommand(growPayload.command, 'NORMAL');
      setExploreOpen(false);
      setActionDone(`${growPayload.city} plan queued.`);
      window.setTimeout(() => setActionDone(''), 4000);
    } finally {
      setStaging(false);
    }
  };

  const handleCompareMarket = () => {
    setGrowCity(growPayload.compareCity);
  };

  const handleLedgerRow = (row) => {
    if (!row?.cab || row.cab === 'Fleet' || row.cab === 'MCO') return;
    const target = findVehicleByCab(row.cab, fleet, realFleet, totalEarnings, syncState);
    setTodayOpen(false);
    openAssetSheet(target);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      clearLocalComplianceState();
      try { sessionStorage.clear(); } catch {}
      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
      setAccountOpen(false);
      onNavigate('landing');
      window.location.hash = '#/landing';
      window.location.reload();
    } finally {
      setSigningOut(false);
    }
  };

  const pages = useMemo(() => [
    {
      id: 'today',
      hero: {
        label: take.label,
        amount: take.amount,
        subline: take.subline,
        labelColor: take.projected ? monument.projected : monument.inkGhost,
      },
      footer: {
        line: actionLine,
        doItLabel: 'Do it',
        secondaryLabel: action.secondary?.label,
        onSecondary: () => openAssetSheet(),
      },
    },
    {
      id: 'fleet',
      hero: {
        label: 'FLEET',
        amount: `${strip.active?.value || 0}/${strip.total || realFleet.length || 0}`,
        subline: fleetSyncHint || `active now · ${fleetCity}`,
        labelColor: monument.inkGhost,
      },
      footer: {
        line: fleetSyncHint || (offline > 0 ? 'CAB offline — needs reconnect.' : 'Fleet healthy.'),
        doItLabel: fleetSyncHint ? 'Sync Tesla' : 'Do it',
        onDoItOverride: fleetSyncHint ? () => onSync() : null,
        secondaryLabel: action.secondary?.label,
        onSecondary: () => openAssetSheet(),
        tertiaryLabel: 'View telemetry',
        onTertiary: () => openTelemetrySheet(),
      },
      showFleetPanel: true,
    },
    {
      id: 'grow',
      hero: {
        label: 'GROW',
        amount: `+$${Math.round((expansion.projectedMonthly || 4960) / 4).toLocaleString()}`,
        subline: `${expansion.city} · per week potential`,
        labelColor: monument.inkGhost,
      },
      footer: {
        line: `${expansion.city} expansion ready when you are.`,
        doItLabel: 'Explore',
        secondaryLabel: null,
        onSecondary: null,
      },
    },
  ], [take, actionLine, action.secondary, strip, realFleet.length, fleetCity, offline, expansion, fleetSyncHint, isLoadingReal]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: monument.canvas }}
    >
      <div
        ref={pagerRef}
        onScroll={handlePagerScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {pages.map((page) => (
          <section
            key={page.id}
            className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col"
            aria-label={page.id}
          >
            <MonumentHero
              {...page.hero}
              onTapAmount={() => handleHeroTap(page.id)}
            />
            {page.showFleetPanel && (
              <FleetMonumentPanel
                strip={strip}
                onSelectStatus={handleFleetStatusSelect}
              />
            )}
            <MonumentActionFooter
              line={page.footer.line}
              onDoIt={page.footer.onDoItOverride || (() => handleDoIt(page.id))}
              doItLabel={page.footer.doItLabel}
              secondaryLabel={page.footer.secondaryLabel}
              onSecondary={page.footer.onSecondary}
              tertiaryLabel={page.footer.tertiaryLabel}
              onTertiary={page.footer.onTertiary}
            />
          </section>
        ))}
      </div>

      <div className="shrink-0 border-t" style={{ borderColor: monument.hairline }}>
        <MonumentUtilityLinks layout="inline" onNavigate={onNavigate} />
        <MonumentSwipeStrip
          active={tab}
          onSelect={scrollToTab}
          onLongPress={() => setAccountOpen(true)}
        />
        <div className="lg:hidden min-h-[4.5rem] shrink-0" aria-hidden="true" />
      </div>

      <ConfirmActionSheet
        open={confirmOpen}
        payload={action.confirm}
        confirming={confirming}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      <AssetDetailSheet
        open={assetOpen}
        payload={assetPayload}
        onClose={() => setAssetOpen(false)}
        onLetItRun={() => setAssetOpen(false)}
        onNudgeRoute={handleNudgeRoute}
        nudging={nudging}
        onViewTelemetry={() => {
          setAssetOpen(false);
          openTelemetrySheet(assetPayload?.cab);
        }}
      />

      <TelemetryDetailSheet
        open={telemetryOpen}
        payload={telemetryPayload}
        onClose={() => setTelemetryOpen(false)}
      />

      <FleetBrowseSheet
        open={fleetBrowseOpen}
        tileKey={fleetBrowseKey}
        fleet={fleet}
        realFleet={realFleet}
        totalEarnings={totalEarnings}
        syncState={syncState}
        onClose={() => setFleetBrowseOpen(false)}
        onViewTelemetry={(cab) => {
          setFleetBrowseOpen(false);
          openTelemetrySheet(cab);
        }}
      />

      <ExploreMarketSheet
        open={exploreOpen}
        payload={growPayload}
        onClose={() => setExploreOpen(false)}
        onStagePlan={handleStagePlan}
        onCompare={handleCompareMarket}
        staging={staging}
      />

      <TodayDetailSheet
        open={todayOpen}
        payload={todayPayload}
        onClose={() => setTodayOpen(false)}
        onSelectRow={handleLedgerRow}
      />

      <AccountSheet
        open={accountOpen}
        payload={accountPayload}
        onClose={() => setAccountOpen(false)}
        onNavigate={onNavigate}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        teslaConnected={teslaConnected}
        onDisconnectTesla={onDisconnect}
      />
    </div>
  );
}
