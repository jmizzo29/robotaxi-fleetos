import { monument, monumentType } from './monumentTokens';

function toneColor(tone) {
  if (tone === 'positive' || tone === 'surge') return monument.money;
  if (tone === 'alert') return monument.projected;
  return monument.inkMuted;
}

export default function FleetLedger({ ledger, compact = false, onSelectRow }) {
  if (!ledger) return null;

  return (
    <div className={compact ? 'px-4' : 'px-[18px]'}>
      {!compact && (
        <div className="pb-2 text-center">
          <p className={`${monumentType.label}`} style={{ color: monument.inkGhost }}>
            {`Fleet ledger · ${ledger.dateLabel}`}
          </p>
        </div>
      )}

      <div className={monumentType.monoSm}>
        {ledger.rows.map((row) => (
          <button
            key={`${row.time}-${row.cab}-${row.event}`}
            type="button"
            onClick={() => onSelectRow?.(row)}
            className="flex w-full items-center gap-2 border-b py-1.5 text-left"
            style={{ borderColor: monument.hairline }}
          >
            <span className="w-9 shrink-0" style={{ color: monument.inkGhost }}>{row.time}</span>
            <span className="w-11 shrink-0 truncate">{row.cab}</span>
            <span className="min-w-0 flex-1 truncate" style={{ color: monument.inkMuted }}>{row.event}</span>
            <span className="w-14 shrink-0 text-right font-semibold" style={{ color: toneColor(row.tone) }}>
              {row.value}
            </span>
          </button>
        ))}
      </div>

      <div
        className={`mt-2 border-t border-dashed pt-2 ${monumentType.monoSm}`}
        style={{ borderColor: monument.hairline }}
      >
        <div className="flex justify-between font-semibold">
          <span>TOTAL</span>
          <span>{ledger.footer.total}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span style={{ color: monument.inkGhost }}>verified</span>
          <span style={{ color: monument.money }}>{ledger.footer.verified}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: monument.inkGhost }}>projected</span>
          <span style={{ color: monument.projected }}>{ledger.footer.projected}</span>
        </div>
        {!compact && ledger.footer.margin !== '—' && (
          <div className="mt-1 flex justify-between">
            <span style={{ color: monument.inkGhost }}>margin</span>
            <span>{ledger.footer.margin}</span>
          </div>
        )}
      </div>
    </div>
  );
}
