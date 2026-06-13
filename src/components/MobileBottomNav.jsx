import { Car, Globe2, LayoutGrid, User, Wrench } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Command', Icon: LayoutGrid, routes: ['overview'] },
  { id: 'fleet', label: 'Fleet', Icon: Car, routes: ['fleet', 'vehicle'] },
  {
    id: 'dispatch',
    label: 'Operations',
    Icon: Wrench,
    routes: ['dispatch', 'charging', 'health', 'readiness', 'alerts'],
  },
  { id: 'network', label: 'Network', Icon: Globe2, routes: ['network'] },
  { id: 'account', label: 'Account', Icon: User, routes: ['account', 'settings'] },
];

export default function MobileBottomNav({ route, onNavigate }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md lg:hidden"
      aria-label="Primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 px-1 pt-1">
        {items.map(({ id, label, Icon, routes }) => {
          const active = routes.includes(route);

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="relative flex min-h-[3.85rem] flex-col items-center justify-center gap-1 px-1 py-2 transition active:scale-[0.98]"
            >
              {active && (
                <span
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-white"
                  aria-hidden="true"
                />
              )}
              <span
                className={`flex h-9 w-11 items-center justify-center rounded-2xl transition-colors ${
                  active ? 'bg-white/12' : 'bg-transparent'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.35 : 2}
                  className={`flex-shrink-0 ${active ? 'text-white' : 'text-white/65'}`}
                />
              </span>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-white' : 'text-white/65'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
