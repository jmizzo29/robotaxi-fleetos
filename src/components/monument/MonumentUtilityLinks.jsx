import { monument, monumentType } from './monumentTokens';

const UTILITY_LINKS = [
  { id: 'map', label: 'Map' },
  { id: 'network', label: 'Network' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];

export default function MonumentUtilityLinks({
  onNavigate,
  active = null,
  layout = 'dock',
}) {
  if (layout === 'inline') {
    return (
      <nav
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-3"
        aria-label="Fleet utilities"
      >
        {UTILITY_LINKS.map((link, index) => (
          <span key={link.id} className="inline-flex items-center gap-3">
            {index > 0 && (
              <span className={monumentType.revealHint} style={{ color: monument.hairline }} aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={`${monumentType.navLabel} transition active:opacity-70`}
              style={{ color: active === link.id ? monument.action : monument.inkMuted }}
            >
              {link.label}
            </button>
          </span>
        ))}
      </nav>
    );
  }

  if (layout === 'dock') {
    return (
      <nav
        className="grid grid-cols-4 gap-1 px-4 pb-1"
        aria-label="Fleet utilities"
      >
        {UTILITY_LINKS.map((link) => {
          const isActive = active === link.id;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={`rounded-xl px-1 py-2.5 text-center transition active:scale-[0.98] ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}
              style={{
                backgroundColor: isActive ? monument.ledgerWash : 'transparent',
                color: isActive ? monument.ink : monument.inkMuted,
              }}
            >
              <span className={`block ${monumentType.revealHint} font-semibold`}>{link.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 ${monumentType.revealHint}`}>
      {UTILITY_LINKS.map((link, index) => (
        <span key={link.id} className="inline-flex items-center gap-3">
          {index > 0 && <span style={{ color: monument.hairline }} aria-hidden="true">·</span>}
          <button
            type="button"
            onClick={() => onNavigate?.(link.id)}
            className="font-semibold transition active:opacity-70"
            style={{ color: active === link.id ? monument.action : monument.inkGhost }}
          >
            {link.label}
          </button>
        </span>
      ))}
    </div>
  );
}
