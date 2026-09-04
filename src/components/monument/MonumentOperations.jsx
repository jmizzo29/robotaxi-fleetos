import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFleetAuthStatus } from '../../auth/FleetAuthContext';
import AccountSheet from './AccountSheet';
import AssetDetailSheet from './AssetDetailSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentBottomChrome from './MonumentBottomChrome';
import MonumentSwipeStrip from './MonumentSwipeStrip';
import MonumentChargePanel from './MonumentChargePanel';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import OperationsMonumentPanel from './OperationsMonumentPanel';
import { sendTeslaChargingCommand } from '../../services/teslaChargingService';
import PlanDetailSheet from './PlanDetailSheet';
import TelemetryDetailSheet from './TelemetryDetailSheet';
import { monument, monumentType } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import {
  findVehicleByCab,
  getAccountSheetPayload,
  getAssetSheetPayload,
  isTeslaConnected,
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
import { getTelemetryFocusTarget, getTelemetrySheetPayload } from '../../utils/telemetryUtils';

const TAB_ORDER = ['plan', 'charge', 'alerts'];

const SWIPE_PAGES = [
  { id: 'plan', label: 'Plan' },
  { id: 'charge', label: 'Charge' },
  { id: 'alerts', label: 'Alerts' },
];

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

export default function MonumentOperations({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  onQueueCommand = () => {},
  onNavigate = () => {},
  initialTab = 'plan',
  onDisconnect = null,
  route = 'dispatch',
}) {
  const { user } = useFleetAuthStatus();
  const [tab, setTab] = useState(initialTab);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chargeConfirm, setChargeConfirm] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const [assetTarget, setAssetTarget] = useState(null);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [telemetryTarget, setTelemetryTarget] = useState(null);
  const pagerRef = useRef(null);
  const scrollRaf = useRef(null);

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );
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

  const requestChargeCommand = ({ vin, name, action: teslaAction, percent }) => {
    const labels = {
      start: { title: 'Start charging?', body: `Ask Tesla to start charging ${name}. Tesla still decides whether the vehicle can charge.`, command: `Start charging ${name}` },
      stop: { title: 'Stop charging?', body: `Ask Tesla to stop charging ${name}.`, command: `Stop charging ${name}` },
      set_limit: { title: `Set charge limit to ${percent}%?`, body: `Ask Tesla to set the charge limit for ${name} to ${percent}%.`, command: `Set charge limit on ${name} to ${percent}%` },
    };
    const copy = labels[teslaAction];
    if (!copy) return;
    setChargeConfirm({
      title: copy.title,
      body: copy.body,
      primaryLabel: 'Confirm',
      command: copy.command,
      teslaAction: { vin, action: teslaAction, percent },
    });
  };

  const handleChargeConfirm = async () => {
    if (!chargeConfirm?.teslaAction) return;
    setConfirming(true);
    try {
      await sendTeslaChargingCommand(chargeConfirm.teslaAction);
      onQueueCommand(chargeConfirm.command, 'HIGH');
      setActionDone('Tesla charging command sent.');
      setChargeConfirm(null);
      window.setTimeout(() => setActionDone(''), 4000);
    } catch (error) {
      setChargeConfirm((current) => (
        current ? { ...current, body: error.message || 'Tesla rejected the charging command.' } : current
      ));
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
    const showTelemetry = pageId === 'plan' || pageId === 'alerts';

    return {
      id: pageId,
      hero,
      footer: {
        line: footerLine,
        doItLabel: pageId === 'plan' ? 'Do it' : pageId === 'charge' ? 'Queue charging' : 'Review alerts',
        secondaryLabel: pageId === 'plan'
          ? action.secondary?.label
          : pageId === 'alerts' && secondaryCab
            ? `View ${secondaryCab}`
            : null,
        onSecondary: pageId === 'plan' && action.secondary
          ? () => {
            const target = findVehicleByCab(
              action.secondary.cab,
              fleet,
              realFleet,
              totalEarnings,
              syncState,
            );
            if (target) openAssetSheet(target);
          }
          : pageId === 'alerts' && secondaryCab
            ? () => {
              const target = findVehicleByCab(secondaryCab, fleet, realFleet, totalEarnings, syncState);
              if (target) openAssetSheet(target);
            }
            : null,
        tertiaryLabel: showTelemetry ? 'View telemetry' : null,
        onTertiary: showTelemetry ? () => openTelemetrySheet() : null,
      },
      showConvoy: pageId === 'plan',
      planRows: pageId === 'plan' ? planPayload.rows.slice(0, 3) : [],
      ledgerRows: pageId === 'charge' ? chargeRows : pageId === 'alerts' ? alertRows : [],
    };
  }), [convoy, actionDone, secondaryCab, action.secondary, chargeRows, alertRows, planPayload.rows, fleet, realFleet, totalEarnings, syncState]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: monument.canvas, backgroundImage: monument.canvasWash }}
    >
      <div className="hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex">
        <div className="shrink-0 border-b px-4" style={{ borderColor: monument.hairline }}>
          <MonumentSwipeStrip
            active={tab}
            pages={SWIPE_PAGES}
            onSelect={scrollToTab}
            showSwipeHint={false}
            ariaLabel="Operations sections"
          />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {pages.filter((page) => page.id === tab).map((page) => (
            <section key={page.id} className="flex h-full min-h-0 min-w-0 flex-col" aria-label={page.id}>
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
              {page.id === 'charge' && (
                <MonumentChargePanel
                  realFleet={realFleet}
                  teslaConnected={teslaConnected}
                  onRequestChargeCommand={requestChargeCommand}
                />
              )}
              <MonumentActionFooter
                line={page.id === 'plan' && offline > 0 && !actionDone
                  ? 'CAB offline — resolve before peak.'
                  : page.footer.line}
                onDoIt={handleDoIt}
                doItLabel={page.footer.doItLabel}
                secondaryLabel={page.footer.secondaryLabel}
                onSecondary={page.footer.onSecondary}
                tertiaryLabel={page.footer.tertiaryLabel}
                onTertiary={page.footer.onTertiary}
              />
            </section>
          ))}
        </div>
      </div>

      <div
        ref={pagerRef}
        onScroll={handlePagerScroll}
        className="flex min-h-0 min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x lg:hidden [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {pages.map((page) => (
          <section
            key={page.id}
            className="flex min-h-0 w-full min-w-0 shrink-0 snap-center snap-always flex-col"
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
            {page.id === 'charge' && (
              <MonumentChargePanel
                realFleet={realFleet}
                teslaConnected={teslaConnected}
                onRequestChargeCommand={requestChargeCommand}
              />
            )}
            <MonumentActionFooter
              line={page.id === 'plan' && offline > 0 && !actionDone
                ? 'CAB offline — resolve before peak.'
                : page.footer.line}
              onDoIt={handleDoIt}
              doItLabel={page.footer.doItLabel}
              secondaryLabel={page.footer.secondaryLabel}
              onSecondary={page.footer.onSecondary}
              tertiaryLabel={page.footer.tertiaryLabel}
              onTertiary={page.footer.onTertiary}
            />
          </section>
        ))}
      </div>

      <div className="lg:hidden">
        <MonumentBottomChrome
          onNavigate={onNavigate}
          commandActive={tab}
          commandPages={SWIPE_PAGES}
          commandAriaLabel="Operations sections"
          onCommandSelect={scrollToTab}
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

      <ConfirmActionSheet
        open={Boolean(chargeConfirm)}
        payload={chargeConfirm}
        confirming={confirming}
        onClose={() => setChargeConfirm(null)}
        onConfirm={handleChargeConfirm}
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

      <AccountSheet
        open={accountOpen}
        payload={accountPayload}
        onClose={() => setAccountOpen(false)}
        onNavigate={onNavigate}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        teslaConnected={teslaConnected}
        onDisconnectTesla={onDisconnect}
        feedbackRoute={route}
      />
    </div>
  );
}
