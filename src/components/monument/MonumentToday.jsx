import { useMemo, useState } from 'react';
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

function MonumentView({ label, amount, subline, labelColor, onTapAmount }) {
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
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionDone, setActionDone] = useState('');

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

  const toggleLedger = () => setLedgerOpen((open) => !open);

  let monumentProps = {
    label: take.label,
    amount: take.amount,
    subline: take.subline,
    labelColor: take.projected ? monument.projected : monument.inkGhost,
    onTapAmount: toggleLedger,
  };

  let footerLine = actionLine;

  if (tab === 'fleet') {
    monumentProps = {
      label: 'FLEET',
      amount: String(strip.active?.value || '0'),
      subline: `${strip.charging?.value || 0} charging · ${strip.offline?.value || 0} offline`,
      onTapAmount: toggleLedger,
    };
    const offline = Number(strip.offline?.value) || 0;
    footerLine = offline > 0 ? 'CAB offline — needs reconnect.' : 'Fleet healthy.';
  }

  if (tab === 'grow') {
    monumentProps = {
      label: 'GROW',
      amount: `+$${Math.round((expansion.projectedMonthly || 4960) / 4).toLocaleString()}`,
      subline: `${expansion.city} · per week potential`,
      onTapAmount: () => {},
    };
    footerLine = `${expansion.city} expansion ready when you are.`;
  }

  return (
    <div
      className="flex min-h-[calc(100vh-0px)] flex-col lg:min-h-screen"
      style={{ backgroundColor: monument.canvas }}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {!ledgerOpen ? (
          <MonumentView {...monumentProps} />
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto pt-4">
            <button
              type="button"
              onClick={toggleLedger}
              className={`mx-auto ${monumentType.monumentSm}`}
              style={{ color: monument.money }}
            >
              {tab === 'grow' ? monumentProps.amount : take.amount}
            </button>
            <FleetLedger ledger={ledger} compact />
          </div>
        )}

        {!ledgerOpen && tab === 'today' && (
          <button
            type="button"
            onClick={toggleLedger}
            className="pb-2 text-center text-[9px] font-medium"
            style={{ color: monument.inkGhost }}
          >
            pull down for ledger
          </button>
        )}
      </div>

      <ActionFooter
        line={footerLine}
        onDoIt={() => setConfirmOpen(true)}
      />

      <MonumentDotNav active={tab} onChange={setTab} />

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
