import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

export default function ExploreMarketSheet({
  open,
  payload,
  onClose,
  onStagePlan,
  onCompare,
  staging = false,
}) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>Grow</p>

        <h2 className={`mt-2.5 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>
          {payload.city}
        </h2>
        <p className="mt-2 text-[38.4px] font-bold leading-none tabular-nums" style={{ color: monument.money }}>
          {payload.weeklyAmount}
        </p>
        <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
          {payload.weeklyLabel}
        </p>

        <p
          className={`mt-3.5 rounded-xl px-3 py-3 ${monumentType.sheetBody}`}
          style={{ backgroundColor: monument.ledgerWash, color: monument.inkMuted }}
        >
          {payload.body}
        </p>

        <p className={`mt-4 ${monumentType.label}`} style={{ color: monument.inkGhost }}>Market ledger</p>
        <div className={`mt-1 space-y-1 ${monumentType.ledgerMono}`}>
          {payload.metrics.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-0.5">
              <span style={{ color: monument.inkGhost }}>{row.label}</span>
              <span
                style={{
                  color: row.positive
                    ? monument.money
                    : row.projected
                      ? monument.projected
                      : monument.ink,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={staging}
          onClick={onStagePlan}
          className={`mt-4 w-full rounded-xl py-3 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98] disabled:opacity-60`}
          style={{ backgroundColor: monument.action }}
        >
          {staging ? 'Staging…' : payload.primaryLabel}
        </button>
        <button
          type="button"
          onClick={onCompare}
          className={`mt-2.5 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          Compare {payload.compareCity}
        </button>
      </div>
    </MonumentSheet>
  );
}
