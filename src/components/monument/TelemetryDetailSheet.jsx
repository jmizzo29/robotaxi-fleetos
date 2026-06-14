import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

function toneColor(tone) {
  if (tone === 'positive') return monument.money;
  if (tone === 'alert') return monument.projected;
  return monument.inkMuted;
}

export default function TelemetryDetailSheet({ open, payload, onClose }) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>Telemetry</p>
        <h2 className={`mt-2.5 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>{payload.cab}</h2>
        <p
          className={`mt-1 ${monumentType.sheetBody}`}
          style={{ color: payload.offline ? monument.projected : monument.money }}
        >
          {payload.statusLine}
        </p>

        <div className={`mt-4 ${monumentType.ledgerMono}`}>
          {payload.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b py-2"
              style={{ borderColor: monument.hairline }}
            >
              <span style={{ color: monument.inkGhost }}>{row.label}</span>
              <span className="font-semibold" style={{ color: toneColor(row.tone) }}>{row.value}</span>
            </div>
          ))}
        </div>

        <p className={`mt-4 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
          Fleet OS signals only — not vehicle controls.
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`mt-3 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          Close
        </button>
      </div>
    </MonumentSheet>
  );
}
