import { Bot, Car, Home, Map } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'ai', label: 'Agent', icon: Bot },
  { id: 'fleet', label: 'Fleet', icon: Car },
];

export default function MobileBottomNav({ route, onNavigate, pendingCount = 0 }) {
  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-ink/10 bg-surface-raised/95 p-1 shadow-[var(--shadow-soft)] backdrop-blur lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          const badge = id === 'ai' && pendingCount > 0 ? pendingCount : null;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
                active ? 'bg-accent text-white' : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {badge && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-caution px-1 text-[9px] font-semibold text-white">
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
