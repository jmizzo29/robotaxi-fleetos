import { monument, monumentType } from '../monument/monumentTokens';

export default function LandingLegalLinks({ onNavigate, layout = 'stack' }) {
  const links = [
    { label: 'Privacy Policy', route: 'privacy' },
    { label: 'Terms of Service', route: 'terms' },
  ];

  if (layout === 'inline') {
    return (
      <div className={`flex items-center justify-center gap-3 ${monumentType.revealHint}`}>
        {links.map((link, index) => (
          <span key={link.route} className="inline-flex items-center gap-3">
            {index > 0 && (
              <span style={{ color: monument.hairline }} aria-hidden="true">·</span>
            )}
            <button
              type="button"
              onClick={() => onNavigate(link.route)}
              className="transition active:opacity-70"
              style={{ color: monument.inkGhost }}
            >
              {link.label}
            </button>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {links.map((link) => (
        <button
          key={link.route}
          type="button"
          onClick={() => onNavigate(link.route)}
          className={`flex w-full items-center justify-between border-t py-3 text-left transition active:bg-black/[0.02] ${monumentType.sheetBody}`}
          style={{ borderColor: monument.hairline, color: monument.ink }}
        >
          <span>{link.label}</span>
          <span style={{ color: monument.inkMuted }}>→</span>
        </button>
      ))}
    </div>
  );
}
