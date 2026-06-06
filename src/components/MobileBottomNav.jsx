const items = [
  { id: 'overview', label: 'Home' },
  { id: 'map', label: 'Map' },
  { id: 'ai', label: 'AI' },
  { id: 'fleet', label: 'Fleet' },
];

export default function MobileBottomNav({ route, onNavigate, pendingCount = 0 }) {
  // Match dark premium look & feel of the main app menus (no icons, white pill active)
  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-1 backdrop-blur lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ id, label }) => {
          const active = route === id;
          const badge = id === 'ai' && pendingCount > 0 ? pendingCount : null;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
                active 
                  ? 'bg-white text-black' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{label}</span>
              {badge && (
                <span className="absolute right-1 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-400 text-black text-[8px] font-semibold px-1">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
