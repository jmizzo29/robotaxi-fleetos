import { monument, monumentType } from './monumentTokens';

export default function OwnerAlertBanner({
  alert,
  onAction,
  onDismiss,
}) {
  if (!alert) return null;

  return (
    <div
      className="shrink-0 border-b px-5 py-3"
      style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
      role="status"
    >
      <p className={monumentType.label} style={{ color: monument.projected }}>{alert.title}</p>
      <p className={`mt-1.5 ${monumentType.sheetBody}`} style={{ color: monument.ink }}>
        {alert.body}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onAction?.(alert)}
          className={`flex-1 rounded-full py-2.5 ${monumentType.buttonPrimary} text-white`}
          style={{ backgroundColor: monument.action }}
        >
          {alert.primaryLabel}
        </button>
        <button
          type="button"
          onClick={() => onDismiss?.(alert)}
          className={`flex-1 rounded-full border py-2.5 ${monumentType.buttonPrimary}`}
          style={{ borderColor: monument.hairline, color: monument.inkMuted }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
