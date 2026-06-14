import MonumentSheet from './MonumentSheet';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import { monument, monumentType } from './monumentTokens';

export default function PlanDetailSheet({ open, payload, onClose, onSelectRow }) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <div className="pt-1 text-center">
          <p
            className="text-[43.2px] font-bold leading-none tabular-nums"
            style={{ color: monument.action }}
          >
            {payload.amount}
          </p>
          <p className={`mt-2 ${monumentType.ledgerLabel}`} style={{ color: monument.inkGhost }}>
            {payload.subtitle}
          </p>
        </div>

        <OperationsLedgerStrip rows={payload.rows} onSelectRow={onSelectRow} />

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
