function NavIcon({ type }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z',
    map: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',
    alerts: 'M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01',
    ai: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Zm6 10 1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1 1-2.7Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d={paths[type]} fill="currentColor" />
    </svg>
  );
}

const items = [
  ['#home', 'home', 'Home'],
  ['#map', 'map', 'Map'],
  ['#alerts', 'alerts', 'Alerts'],
  ['#ai-actions', 'ai', 'AI'],
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/10 bg-slate-950/92 p-2 shadow-2xl shadow-black/40 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map(([href, icon, label]) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-sky-300"
          >
            <NavIcon type={icon} />
            <span>{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
