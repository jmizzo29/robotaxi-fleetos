import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';

export default function PublicFooter({ onNavigate }) {
  const links = [
    ['how-it-works', 'How it works'],
    ['about', 'About'],
    ['privacy', 'Privacy'],
    ['terms', 'Terms'],
  ];

  return (
    <footer className="border-t border-ink/8 bg-surface-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5" aria-label="ROBOAGENT home">
          <RoboLogo className="h-7 w-7" />
          <RoboWordmark className="text-sm tracking-tight" />
        </button>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map(([target, label]) => (
            <button
              key={target}
              onClick={() => onNavigate(target)}
              className="text-sm font-medium text-ink-muted transition hover:text-ink"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <p className="text-xs text-ink-subtle">
          ROBOAGENT beta · Built on the official Tesla Fleet API. Not affiliated with or endorsed by Tesla, Inc.
        </p>
      </div>
    </footer>
  );
}
