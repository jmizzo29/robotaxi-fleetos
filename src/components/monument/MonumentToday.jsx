import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import AssetDetailSheet from './AssetDetailSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import ExploreMarketSheet from './ExploreMarketSheet';
import MonumentDotNav from './MonumentDotNav';
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
} from '../../utils/monumentUtils';
import { getCommandFleetStatusStrip } from '../../utils/vehicleDisplayUtils';
import { getExpansionRecommendation } from '../../utils/networkIntelligenceUtils';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

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

function ActionFooter({ line, onDoIt, doItLabel = 'Do it', secondaryLabel, onSecondary }) {
  return (
    <div className="shrink-0 px-7 pb-2 text-center">
      <Hairline />
      <p className={`mt-6 ${monumentType.actionLine}`} style={{ color: monument.ink }}>{line}</p>
      <button
        type="button"
        onClick={onDoIt}
        className={`mt-4 ${monumentType.actionLink}`}
        style={{ color: monument.action }}
      >
        {doItLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button
          type="button"
          onClick={onSecondary}
          className={`mt-3 block w-full ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          {secondaryLabel}
        </button>
      )}
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

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
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

  const openAssetSheet = (target = null) => {
    setAssetTarget(target || getTopEarner(fleet, realFleet, totalEarnings, syncState));
    setAssetOpen(true);
  };

  const handleHeroTap = () => {
    if (tab === 'grow') {
      setGrowCity('Tampa');
      setExploreOpen(true);
      return;
    }
    setTodayOpen(true);
  };

  const handleDoIt = () => {
    if (tab === 'grow') {
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

  let heroProps = {
    label: take.label,
    amount: take.amount,
    subline: take.subline,
    labelColor: take.projected ? monument.projected : monument.inkGhost,
    onTapAmount: handleHeroTap,
  };

  let footerLine = actionLine;
  let doItLabel = 'Do it';
  let secondaryLabel = tab === 'today' ? action.secondary?.label : null;

  if (tab === 'fleet') {
    heroProps = {
      label: 'FLEET',
      amount: String(strip.active?.value || '0'),
      subline: `${strip.charging?.value || 0} charging · ${strip.offline?.value || 0} offline`,
      labelColor: monument.inkGhost,
      onTapAmount: handleHeroTap,
    };
    const offline = Number(strip.offline?.value) || 0;
    footerLine = offline > 0 ? 'CAB offline — needs reconnect.' : 'Fleet healthy.';
    secondaryLabel = null;
  }

  if (tab === 'grow') {
    heroProps = {
      label: 'GROW',
      amount: `+$${Math.round((expansion.projectedMonthly || 4960) / 4).toLocaleString()}`,
      subline: `${expansion.city} · per week potential`,
      labelColor: monument.inkGhost,
      onTapAmount: handleHeroTap,
    };
    footerLine = `${expansion.city} expansion ready when you are.`;
    doItLabel = 'Explore';
    secondaryLabel = null;
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: monument.canvas }}
    >
      <MonumentHero {...heroProps} />

      <div className="shrink-0">
        <ActionFooter
          line={footerLine}
          onDoIt={handleDoIt}
          doItLabel={doItLabel}
          secondaryLabel={secondaryLabel}
          onSecondary={() => openAssetSheet()}
        />
      </div>

      <div className="shrink-0">
        <MonumentDotNav
          active={tab}
          onChange={setTab}
          onLongPress={() => setAccountOpen(true)}
        />
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
      />
    </div>
  );
}
