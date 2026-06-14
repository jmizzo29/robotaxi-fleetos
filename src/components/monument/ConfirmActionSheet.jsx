import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

export default function ConfirmActionSheet({
  open,
  payload,
  confirming = false,
  onClose,
  onConfirm,
}) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <p className={`${monumentType.label}`} style={{ color: monument.inkGhost }}>Confirm</p>
        <h2 className={`mt-3 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>
          {payload.title}
        </h2>
        <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
          {payload.body}
        </p>

        {Array.isArray(payload.metrics) && payload.metrics.length > 0 && (
          <div
            className="mt-4 rounded-xl px-3 py-3"
            style={{ backgroundColor: monument.ledgerWash }}
          >
            {payload.metrics.map((row) => (
              <div key={row.label} className={`flex justify-between gap-3 ${monumentType.monoSm}`}>
                <span style={{ color: monument.inkGhost }}>{row.label}</span>
                <span style={{ color: row.positive ? monument.money : monument.ink }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className={`mt-4 w-full rounded-xl py-3 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98] disabled:opacity-60`}
          style={{ backgroundColor: monument.action }}
        >
          {confirming ? 'Confirming…' : payload.primaryLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={`mt-2.5 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          Not now
        </button>
      </div>
    </MonumentSheet>
  );
}
