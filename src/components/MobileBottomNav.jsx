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

const ICON_SIZE = 21;

export default function MobileBottomNav({ route, onNavigate }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/98 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.18)] backdrop-blur-lg lg:hidden"
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
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 px-0.5 pb-2 pt-2.5 transition active:scale-[0.98]"
            >
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-[#2563eb]"
                  aria-hidden="true"
                />
              )}
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                  active ? 'bg-[#eff6ff]' : 'bg-transparent'
                }`}
              >
                <Icon
                  size={ICON_SIZE}
                  strokeWidth={active ? 2.4 : 2}
                  className={`flex-shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`}
                />
              </span>
              <span
                className={`w-full px-0.5 text-center text-[9.5px] font-semibold leading-tight ${
                  active ? 'text-[#2563eb]' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
