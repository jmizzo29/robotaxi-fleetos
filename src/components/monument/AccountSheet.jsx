import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

export default function AccountSheet({
  open,
  payload,
  onClose,
  onNavigate,
  onSignOut,
  signingOut = false,
}) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="pb-2">
        <p className={`px-[18px] ${monumentType.label}`} style={{ color: monument.inkGhost }}>Account</p>

        <div className="px-[18px] pt-2.5">
          <h2 className={`${monumentType.sheetTitle}`} style={{ color: monument.ink }}>{payload.name}</h2>
          <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
            {payload.subtitle}
          </p>
        </div>

        {payload.rows.map((row) => {
          const interactive = Boolean(row.route);
          return (
            <button
              key={row.label}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (row.route) {
                  onClose?.();
                  onNavigate?.(row.route);
                }
              }}
              className={`flex w-full items-center justify-between border-t px-[18px] py-3 text-left ${monumentType.sheetBody} ${
                interactive ? 'transition active:bg-black/[0.02]' : 'cursor-default'
              }`}
              style={{ borderColor: monument.hairline }}
            >
              <span style={{ color: monument.ink }}>{row.label}</span>
              <span className="font-semibold" style={{ color: monument.inkMuted }}>{row.value}</span>
            </button>
          );
        })}

        <button
          type="button"
          disabled={signingOut}
          onClick={onSignOut}
          className={`mt-2 w-full py-2.5 ${monumentType.actionLink} disabled:opacity-60`}
          style={{ color: monument.inkMuted }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </MonumentSheet>
  );
}
