import { Home, Map, Cpu, Car } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Home',  Icon: Home },
  { id: 'map',      label: 'Map',   Icon: Map  },
  { id: 'ai',       label: 'AI',    Icon: Cpu  },
  { id: 'fleet',    label: 'Fleet', Icon: Car  },
];

export default function MobileBottomNav({ route, onNavigate, pendingCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 lg:hidden"
      aria-label="Primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4">
        {items.map(({ id, label, Icon }) => {
          const active = route === id;
          const badge = id === 'ai' && pendingCount > 0 ? pendingCount : null;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 min-h-[3.75rem] transition-colors ${
                active ? 'text-white' : 'text-gray-600 active:text-gray-400'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.75}
                className="flex-shrink-0"
              />
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-white' : 'text-gray-600'}`}>
                {label}
              </span>
              {badge && (
                <span className="absolute top-2 right-[22%] flex h-4 min-w-4 items-center justify-center rounded-full bg-white text-black text-[8px] font-bold px-1">
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
