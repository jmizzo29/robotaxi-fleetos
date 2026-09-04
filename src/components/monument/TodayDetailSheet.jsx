import MonumentSheet from './MonumentSheet';
import FleetLedger from './FleetLedger';
import { monument, monumentType } from './monumentTokens';

export default function TodayDetailSheet({ open, payload, onClose, onSelectRow }) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose} desktop="panel">
      <div className="px-[18px] pb-2">
        <div className="pt-1 text-center">
          <p
            className="text-[43.2px] font-bold leading-none tabular-nums"
            style={{ color: monument.money }}
          >
            {payload.amount}
          </p>
          <p className={`mt-2 ${monumentType.ledgerLabel}`} style={{ color: monument.inkGhost }}>
            {`Fleet ledger · ${payload.ledger.dateLabel}`}
          </p>
        </div>

        <FleetLedger ledger={payload.ledger} compact onSelectRow={onSelectRow} />

        <button
          type="button"
          onClick={onClose}
          className={`mt-2 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          Close
        </button>
      </div>
    </MonumentSheet>
  );
}
