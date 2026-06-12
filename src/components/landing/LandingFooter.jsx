export default function LandingFooter({ onNavigate }) {
  const links = [
    ['how-it-works', 'How it Works'],
    ['about', 'About'],
    ['privacy', 'Privacy'],
    ['terms', 'Terms'],
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="text-left transition hover:opacity-80"
        >
          <span className="font-brand text-base font-semibold text-white">ROBOAGENT</span>
        </button>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map(([target, label]) => (
            <button
              key={target}
              type="button"
              onClick={() => onNavigate(target)}
              className="text-sm font-medium text-white/50 transition hover:text-white/80"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-8 md:px-8">
        <p className="text-xs leading-relaxed text-white/35">
          Built on the official Tesla Fleet API. Not affiliated with or endorsed by Tesla, Inc.
        </p>
      </div>
    </footer>
  );
}
