import { monument, monumentType } from './monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

export default function MonumentActionFooter({
  line,
  onDoIt,
  doItLabel = 'Do it',
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
}) {
  return (
    <div className="shrink-0 px-7 pb-2 text-center">
      <Hairline />
      <p
        className={`mx-auto mt-6 max-w-xl break-words ${monumentType.actionLine}`}
        style={{ color: monument.ink }}
      >
        {line}
      </p>
      {onDoIt && (
        <button
          type="button"
          onClick={onDoIt}
          className={`mt-4 ${monumentType.actionLink}`}
          style={{ color: monument.action }}
        >
          {doItLabel}
        </button>
      )}
      {(secondaryLabel || tertiaryLabel) && (
        <div className={`mt-3 flex items-center justify-center gap-5 ${monumentType.actionLink}`}>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              style={{ color: monument.inkMuted }}
            >
              {secondaryLabel}
            </button>
          )}
          {tertiaryLabel && onTertiary && (
            <button
              type="button"
              onClick={onTertiary}
              style={{ color: monument.action }}
            >
              {tertiaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
