import { useMemo, useState } from 'react';
import { useFleetAuthStatus } from '../auth/FleetAuthContext';
import { monument } from '../components/monument/monumentTokens';
import { clearLocalComplianceState } from '../services/betaCompliance';
import { logoutFleetOsAccount } from '../services/sessionService';
import { wakeTeslaVehicle } from '../services/teslaService';
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
} from '../utils/monumentUtils';
import { getTelemetryFocusTarget, getTelemetrySheetPayload } from '../utils/telemetryUtils';
import { getCommandFleetStatusStrip } from '../utils/vehicleDisplayUtils';
import { getExpansionRecommendation, getGrowHero } from '../utils/networkIntelligenceUtils';

export const FLEET_WAKE_CONFIRM = {
  title: 'Wake vehicle?',
  body: 'This asks Tesla to bring your Cybercab online. It may use vehicle power. After wake, ROBOAGENT refreshes telemetry automatically.',
  primaryLabel: 'Wake & sync',
};

export default function useMonumentCommand({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  onQueueCommand = () => {},
  onNavigate = () => {},
  onSync = () => {},
}) {
  const { user } = useFleetAuthStatus();
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
  const [wakeConfirmOpen, setWakeConfirmOpen] = useState(false);
  const [wakingFleet, setWakingFleet] = useState(false);

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
  const growHero = useMemo(() => getGrowHero(expansion), [expansion]);
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
  const fleetAsleep = realFleet.length > 0 && offline > 0;
  const fleetSyncHint = realFleet.length === 0 && realSyncStatus?.state === 'error'
    ? realSyncStatus.message
    : realFleet.length === 0 && !isLoadingReal
      ? 'Tesla connected? Sync from Settings to load your vehicle.'
      : null;

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

  const telemetryPayload = useMemo(
    () => getTelemetrySheetPayload(telemetryTarget?.vehicle, telemetryTarget?.cab, realSyncStatus),
    [telemetryTarget, realSyncStatus],
  );

  const wakeTarget = useMemo(
    () => getTelemetryFocusTarget(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const handleWakeConfirm = async () => {
    const vehicle = wakeTarget?.vehicle;
    if (!vehicle) return;

    setWakingFleet(true);
    try {
      await wakeTeslaVehicle(vehicle);
      setWakeConfirmOpen(false);
      setActionDone('Wake sent — syncing telemetry…');
      window.setTimeout(() => {
        onSync({ force: true });
      }, 2000);
      window.setTimeout(() => setActionDone(''), 5000);
    } catch (error) {
      setActionDone(error.message || 'Wake request failed.');
      window.setTimeout(() => setActionDone(''), 5000);
    } finally {
      setWakingFleet(false);
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
      footer: fleetAsleep
        ? {
          line: 'CAB asleep — wake & sync to load all telemetry.',
          doItLabel: wakingFleet || isLoadingReal ? 'Syncing…' : 'Wake & sync',
          onDoItOverride: () => {
            if (wakingFleet || isLoadingReal) return;
            setWakeConfirmOpen(true);
          },
          secondaryLabel: 'Sync now',
          onSecondary: () => onSync({ force: true }),
          tertiaryLabel: 'View telemetry',
          onTertiary: () => openTelemetrySheet(),
        }
        : {
          line: fleetSyncHint || (offline > 0 ? 'CAB offline — needs reconnect.' : 'Fleet healthy.'),
          doItLabel: fleetSyncHint ? 'Sync Tesla' : 'Do it',
          onDoItOverride: fleetSyncHint ? () => onSync({ force: true }) : null,
          secondaryLabel: fleetSyncHint ? null : 'Add vehicle',
          onSecondary: fleetSyncHint ? null : () => onNavigate('add-vehicle'),
          tertiaryLabel: fleetSyncHint ? null : 'View telemetry',
          onTertiary: fleetSyncHint ? null : () => openTelemetrySheet(),
        },
      showFleetPanel: true,
    },
    {
      id: 'grow',
      hero: {
        label: 'GROW',
        amount: growHero.amount,
        subline: growHero.subline,
        labelColor: monument.inkGhost,
      },
      footer: {
        line: growHero.line,
        doItLabel: 'Explore',
        secondaryLabel: null,
        onSecondary: null,
      },
    },
  ], [take, actionLine, action.secondary, strip, realFleet.length, fleetCity, offline, fleetAsleep, growHero, fleetSyncHint, isLoadingReal, wakingFleet, onSync, onNavigate]);

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

  const handleFleetStatusSelect = (tileKey) => {
    setFleetBrowseKey(tileKey);
    setFleetBrowseOpen(true);
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

  return {
    pages,
    action,
    strip,
    syncState,
    totalEarnings,
    teslaConnected,
    accountPayload,
    assetPayload,
    growPayload,
    todayPayload,
    telemetryPayload,
    confirmOpen,
    setConfirmOpen,
    assetOpen,
    setAssetOpen,
    exploreOpen,
    setExploreOpen,
    todayOpen,
    setTodayOpen,
    accountOpen,
    setAccountOpen,
    confirming,
    nudging,
    staging,
    signingOut,
    fleetBrowseOpen,
    setFleetBrowseOpen,
    fleetBrowseKey,
    handleHeroTap,
    handleDoIt,
    handleConfirm,
    handleNudgeRoute,
    handleStagePlan,
    handleCompareMarket,
    handleLedgerRow,
    handleFleetStatusSelect,
    handleSignOut,
    handleWakeConfirm,
    openAssetSheet,
    openTelemetrySheet,
    telemetryOpen,
    setTelemetryOpen,
    wakeConfirmOpen,
    setWakeConfirmOpen,
    wakingFleet,
  };
}
