import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ConfirmActionSheet from './ConfirmActionSheet';
import FleetLedger from './FleetLedger';
import MonumentDotNav from './MonumentDotNav';
import { monument, monumentType } from './monumentTokens';
import {
  getFleetLedger,
  getMonumentAction,
  getMonumentTake,
} from '../../utils/monumentUtils';
import { getCommandFleetStatusStrip } from '../../utils/vehicleDisplayUtils';
import { getExpansionRecommendation } from '../../utils/networkIntelligenceUtils';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

function MonumentHero({
  label,
  amount,
  subline,
  labelColor,
  onTapAmount,
  showLedgerHint = false,
  onRevealLedger,
}) {
  return (
    <div className="flex min-h-[min(58vh,520px)] flex-col items-center justify-center px-6 text-center">
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
      {showLedgerHint && (
        <button
          type="button"
          onClick={onRevealLedger}
          className="mt-8 flex flex-col items-center gap-1.5 touch-manipulation"
          aria-label="Reveal fleet ledger"
        >
          <span className={monumentType.revealHint} style={{ color: monument.inkGhost }}>
            Pull down for ledger
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: monument.inkGhost }} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function ActionFooter({ line, onDoIt }) {
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
        Do it
      </button>
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
}) {
  const [tab, setTab] = useState('today');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const scrollRef = useRef(null);
  const ledgerRef = useRef(null);

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

  const ledger = useMemo(
    () => getFleetLedger(fleet, realFleet, totalEarnings, syncState, take.amount),
    [fleet, realFleet, totalEarnings, syncState, take.amount],
  );

  const strip = useMemo(
    () => getCommandFleetStatusStrip(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const expansion = useMemo(() => getExpansionRecommendation(fleet), [fleet]);

  const actionLine = actionDone || action.line.replace(/\.$/, '');

  const revealLedger = () => {
    const ledgerEl = ledgerRef.current;
    const scroller = scrollRef.current;
    if (!ledgerEl || !scroller) return;

    const top =
      ledgerEl.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;

    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
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

  let heroProps = {
    label: take.label,
    amount: take.amount,
    subline: take.subline,
    labelColor: take.projected ? monument.projected : monument.inkGhost,
    onTapAmount: revealLedger,
    showLedgerHint: tab === 'today',
    onRevealLedger: revealLedger,
  };

  let footerLine = actionLine;
  const showLedger = tab === 'today' || tab === 'fleet';

  if (tab === 'fleet') {
    heroProps = {
      label: 'FLEET',
      amount: String(strip.active?.value || '0'),
      subline: `${strip.charging?.value || 0} charging · ${strip.offline?.value || 0} offline`,
      labelColor: monument.inkGhost,
      onTapAmount: revealLedger,
      showLedgerHint: true,
      onRevealLedger: revealLedger,
    };
    const offline = Number(strip.offline?.value) || 0;
    footerLine = offline > 0 ? 'CAB offline — needs reconnect.' : 'Fleet healthy.';
  }

  if (tab === 'grow') {
    heroProps = {
      label: 'GROW',
      amount: `+$${Math.round((expansion.projectedMonthly || 4960) / 4).toLocaleString()}`,
      subline: `${expansion.city} · per week potential`,
      labelColor: monument.inkGhost,
      onTapAmount: () => {},
      showLedgerHint: false,
      onRevealLedger: () => {},
    };
    footerLine = `${expansion.city} expansion ready when you are.`;
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: monument.canvas }}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <MonumentHero {...heroProps} />

        {showLedger && (
          <section ref={ledgerRef} className="border-t pt-2" style={{ borderColor: monument.hairline }}>
            <button
              type="button"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`mx-auto block pb-2 ${monumentType.ledgerAmount}`}
              style={{ color: monument.money }}
            >
              {tab === 'grow' ? heroProps.amount : take.amount}
            </button>
            <FleetLedger ledger={ledger} compact />
            <p className={`pb-6 pt-2 text-center ${monumentType.ledgerHint}`} style={{ color: monument.inkGhost }}>
              Pull up to close
            </p>
          </section>
        )}
      </div>

      <div className="shrink-0">
        <ActionFooter
          line={footerLine}
          onDoIt={() => setConfirmOpen(true)}
        />
      </div>

      <div className="shrink-0">
        <MonumentDotNav active={tab} onChange={setTab} />
      </div>

      <ConfirmActionSheet
        open={confirmOpen}
        payload={action.confirm}
        confirming={confirming}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
