import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import AssetDetailSheet from './AssetDetailSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import MonumentSwipeStrip from './MonumentSwipeStrip';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import OperationsMonumentPanel from './OperationsMonumentPanel';
import PlanDetailSheet from './PlanDetailSheet';
import { monument, monumentType } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import {
  findVehicleByCab,
  getAccountSheetPayload,
  getAssetSheetPayload,
} from '../../utils/monumentUtils';
import {
  getAlertsLedgerRows,
  getChargeLedgerRows,
  getOperationsAction,
  getOperationsConvoy,
  getOperationsFooterLine,
  getOperationsHero,
  getPlanDetailPayload,
} from '../../utils/operationsUtils';

const TAB_ORDER = ['plan', 'charge', 'alerts'];

const SWIPE_PAGES = [
  { id: 'plan', label: 'Plan' },
  { id: 'charge', label: 'Charge' },
  { id: 'alerts', label: 'Alerts' },
];

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

function amountStyle(kind) {
  if (kind === 'projected') return monument.projected;
  if (kind === 'action') return monument.action;
  return monument.money;
}

function MonumentHero({ label, amount, subline, labelColor, amountColor, onTapAmount }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className={monumentType.label} style={{ color: labelColor || monument.inkGhost }}>{label}</p>
      <button
        type="button"
        onClick={onTapAmount}
        className={`mt-5 ${monumentType.monument}`}
        style={{ color: amountStyle(amountColor) }}
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

export default function MonumentOperations({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  onQueueCommand = () => {},
  onNavigate = () => {},
  initialTab = 'plan',
}) {
  const { user } = useUser();
  const [tab, setTab] = useState(initialTab);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const [assetTarget, setAssetTarget] = useState(null);
  const pagerRef = useRef(null);
  const scrollRaf = useRef(null);

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);

  const convoy = useMemo(
    () => getOperationsConvoy(fleet, realFleet, totalEarnings, syncState, realSyncStatus, commandQueue),
    [fleet, realFleet, totalEarnings, syncState, realSyncStatus, commandQueue],
  );

  const action = useMemo(
    () => getOperationsAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings),
    [fleet, realFleet, realSyncStatus, commandQueue, totalEarnings],
  );

  const planPayload = useMemo(
    () => getPlanDetailPayload(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const chargeRows = useMemo(
    () => getChargeLedgerRows(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const alertRows = useMemo(
    () => getAlertsLedgerRows(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const assetPayload = useMemo(
    () => getAssetSheetPayload(fleet, realFleet, totalEarnings, syncState, assetTarget),
    [fleet, realFleet, totalEarnings, syncState, assetTarget],
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

  const scrollToTab = useCallback((nextTab) => {
    const index = TAB_ORDER.indexOf(nextTab);
    const el = pagerRef.current;
    if (!el || index < 0) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setTab(nextTab);
  }, []);

  useEffect(() => {
    if (!TAB_ORDER.includes(initialTab)) return;
    scrollToTab(initialTab);
  }, [initialTab, scrollToTab]);

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
    setAssetTarget(target);
    setAssetOpen(true);
  };

  const handleLedgerRow = (row) => {
    if (!row?.cab || row.cab === 'MCO') return;
    const target = findVehicleByCab(row.cab, fleet, realFleet, totalEarnings, syncState);
    if (target) openAssetSheet(target);
  };

  const handleTileSelect = (tileKey) => {
    if (tileKey === 'charge') {
      scrollToTab('charge');
      return;
    }
    if (tileKey === 'alert') {
      scrollToTab('alerts');
      return;
    }
    setPlanOpen(true);
  };

  const handleHeroTap = (pageId) => {
    if (pageId === 'plan') {
      setPlanOpen(true);
      return;
    }
    if (pageId === 'charge' || pageId === 'alerts') {
      const rows = pageId === 'charge' ? chargeRows : alertRows;
      if (rows[0]) handleLedgerRow(rows[0]);
    }
  };

  const handleDoIt = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const { confirm } = action;
    setConfirming(true);
    try {
      onQueueCommand(confirm.command, confirm.priority);
      setActionDone('Tonight\'s plan queued.');
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

  const secondaryCab = action.secondary?.cab;
  const offline = Number(convoy.strip?.offline?.value) || 0;

  const pages = useMemo(() => TAB_ORDER.map((pageId) => {
    const hero = getOperationsHero(convoy, pageId);
    const footerLine = getOperationsFooterLine(convoy, pageId, actionDone);

    return {
      id: pageId,
      hero,
      footer: {
        line: footerLine,
        doItLabel: pageId === 'plan' ? 'Do it' : pageId === 'charge' ? 'Queue charging' : 'Review alerts',
        secondaryLabel: pageId === 'alerts' && secondaryCab ? `View ${secondaryCab}` : null,
        onSecondary: pageId === 'alerts' && secondaryCab
          ? () => {
            const target = findVehicleByCab(secondaryCab, fleet, realFleet, totalEarnings, syncState);
            if (target) openAssetSheet(target);
          }
          : null,
      },
      showConvoy: pageId === 'plan',
      planRows: pageId === 'plan' ? planPayload.rows.slice(0, 3) : [],
      ledgerRows: pageId === 'charge' ? chargeRows : pageId === 'alerts' ? alertRows : [],
    };
  }), [convoy, actionDone, secondaryCab, chargeRows, alertRows, planPayload.rows, fleet, realFleet, totalEarnings, syncState]);

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
            {page.showConvoy && (
              <OperationsMonumentPanel
                convoy={convoy}
                onSelectTile={handleTileSelect}
              />
            )}
            {page.planRows?.length > 0 && (
              <OperationsLedgerStrip
                rows={page.planRows}
                onSelectRow={handleLedgerRow}
              />
            )}
            {page.ledgerRows.length > 0 && (
              <OperationsLedgerStrip
                rows={page.ledgerRows}
                onSelectRow={handleLedgerRow}
              />
            )}
            <ActionFooter
              line={page.id === 'plan' && offline > 0 && !actionDone
                ? 'CAB offline — resolve before peak.'
                : page.footer.line}
              onDoIt={handleDoIt}
              doItLabel={page.footer.doItLabel}
              secondaryLabel={page.footer.secondaryLabel}
              onSecondary={page.footer.onSecondary}
            />
          </section>
        ))}
      </div>

      <MonumentSwipeStrip
        active={tab}
        pages={SWIPE_PAGES}
        ariaLabel="Operations sections"
        onSelect={scrollToTab}
        onLongPress={() => setAccountOpen(true)}
      />

      <ConfirmActionSheet
        open={confirmOpen}
        payload={action.confirm}
        confirming={confirming}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      <PlanDetailSheet
        open={planOpen}
        payload={planPayload}
        onClose={() => setPlanOpen(false)}
        onSelectRow={(row) => {
          setPlanOpen(false);
          handleLedgerRow(row);
        }}
      />

      <AssetDetailSheet
        open={assetOpen}
        payload={assetPayload}
        onClose={() => setAssetOpen(false)}
        onLetItRun={() => setAssetOpen(false)}
        onNudgeRoute={handleNudgeRoute}
        nudging={nudging}
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
