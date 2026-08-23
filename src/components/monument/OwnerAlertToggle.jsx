import { monument, monumentType } from './monumentTokens';

export default function OwnerAlertToggle({
  enabled,
  busy,
  permission,
  error,
  onEnable,
  onDisable,
}) {
  const handleChange = () => {
    if (busy) return;
    if (enabled) onDisable?.();
    else onEnable?.();
  };

  return (
    <div className="shrink-0 px-5 pb-3">
      <div
        className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5"
        style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
      >
        <div className="min-w-0">
          <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Owner alert</p>
          <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.ink }}>
            {enabled
              ? 'On — we reach you when the car actually needs you.'
              : 'Off until you allow notifications.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={handleChange}
          className="relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60"
          style={{ backgroundColor: enabled ? monument.action : monument.ledgerWash }}
        >
          <span
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition"
            style={{ left: enabled ? '1.4rem' : '0.15rem' }}
          />
        </button>
      </div>
      {permission === 'denied' && (
        <p className={`mt-2 ${monumentType.ledgerHint}`} style={{ color: monument.projected }}>
          Notifications are blocked in the browser. Enable them for this site to get the phone alert.
        </p>
      )}
      {error && (
        <p className={`mt-2 ${monumentType.ledgerHint}`} style={{ color: monument.projected }}>{error}</p>
      )}
    </div>
  );
}
