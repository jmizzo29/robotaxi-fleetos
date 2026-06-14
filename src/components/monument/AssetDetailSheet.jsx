import { MapPin } from 'lucide-react';
import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

function LedgerRow({ row }) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b py-2 ${monumentType.ledgerMono}`}
      style={{ borderColor: monument.hairline }}
    >
      <span className="w-11 shrink-0" style={{ color: monument.inkGhost }}>{row.time}</span>
      <span className="w-14 shrink-0 truncate">{row.cab}</span>
      <span className="min-w-0 flex-1 truncate" style={{ color: monument.inkMuted }}>{row.event}</span>
      <span
        className="w-[4.5rem] shrink-0 text-right font-semibold"
        style={{ color: row.tone === 'positive' || row.tone === 'surge' ? monument.money : monument.inkMuted }}
      >
        {row.value}
      </span>
    </div>
  );
}

export default function AssetDetailSheet({
  open,
  payload,
  onClose,
  onLetItRun,
  onNudgeRoute,
  nudging = false,
}) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>Asset</p>

        <div className="mt-2.5 flex items-start justify-between gap-3">
          <div>
            <h2 className={monumentType.sheetTitle} style={{ color: monument.ink }}>{payload.cab}</h2>
            <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.money }}>
              {payload.statusLine}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[26.4px] font-bold leading-none tabular-nums" style={{ color: monument.money }}>
              {payload.revenue}
            </p>
            <p className={`mt-1 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>today</p>
          </div>
        </div>

        <div
          className="mt-3.5 flex h-[72px] items-center justify-center rounded-xl"
          style={{ backgroundColor: monument.ledgerWash }}
        >
          <MapPin className="h-4 w-4" style={{ color: monument.inkGhost }} strokeWidth={1.75} />
          <span className={`ml-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
            {payload.hasLocation ? 'Live position' : 'quiet map pin'}
          </span>
        </div>

        <p className={`mt-4 ${monumentType.label}`} style={{ color: monument.inkGhost }}>Today ledger</p>
        <div className="mt-1">
          {payload.rows.map((row) => (
            <LedgerRow key={`${row.time}-${row.event}`} row={row} />
          ))}
        </div>

        <div
          className={`mt-2.5 rounded-xl px-3 py-3 ${monumentType.monoSm}`}
          style={{ backgroundColor: monument.ledgerWash }}
        >
          {payload.metrics.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-0.5">
              <span style={{ color: monument.inkGhost }}>{row.label}</span>
              <span style={{ color: row.positive ? monument.money : monument.ink }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onLetItRun}
          className={`mt-4 w-full rounded-xl py-3 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98]`}
          style={{ backgroundColor: monument.action }}
        >
          Let it run
        </button>
        <button
          type="button"
          disabled={nudging}
          onClick={onNudgeRoute}
          className={`mt-2.5 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          {nudging ? 'Queuing…' : 'Nudge route'}
        </button>
      </div>
    </MonumentSheet>
  );
}
