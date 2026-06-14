import { monument, monumentType } from './monumentTokens';

function toneColor(tone) {
  if (tone === 'positive' || tone === 'surge') return monument.money;
  if (tone === 'alert') return monument.projected;
  return monument.inkMuted;
}

export default function OperationsLedgerStrip({ rows = [], onSelectRow }) {
  if (!rows.length) return null;

  return (
    <div className="w-full px-[22px] pb-2">
      <div className={monumentType.ledgerMono}>
        {rows.map((row) => (
          <button
            key={`${row.cab}-${row.event}`}
            type="button"
            onClick={() => onSelectRow?.(row)}
            className="flex w-full items-center gap-2.5 border-b py-2 text-left"
            style={{ borderColor: monument.hairline }}
          >
            <span className="w-14 shrink-0 truncate">{row.cab}</span>
            <span className="min-w-0 flex-1 truncate" style={{ color: monument.inkMuted }}>{row.event}</span>
            <span className="w-[4.5rem] shrink-0 text-right font-semibold" style={{ color: toneColor(row.tone) }}>
              {row.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
