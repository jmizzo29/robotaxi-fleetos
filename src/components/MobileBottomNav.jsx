import { BarChart3, Car, LayoutGrid, User, Wrench } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Command', Icon: LayoutGrid, routes: ['overview'] },
  { id: 'fleet', label: 'Fleet', Icon: Car, routes: ['fleet', 'vehicle'] },
  {
    id: 'dispatch',
    label: 'Operations',
    Icon: Wrench,
    routes: ['dispatch', 'charging', 'health', 'readiness', 'alerts'],
  },
  { id: 'finance', label: 'Analytics', Icon: BarChart3, routes: ['finance', 'reports'] },
  { id: 'account', label: 'Account', Icon: User, routes: ['account', 'settings'] },
];

export default function MobileBottomNav({ route, onNavigate }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black lg:hidden"
      aria-label="Primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {items.map(({ id, label, Icon, routes }) => {
          const active = routes.includes(route);

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 px-2 py-3 transition-colors ${
                active ? 'text-white' : 'text-white/35 active:text-white/55'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.75}
                className="flex-shrink-0"
              />
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-white' : 'text-white/35'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
