import { Globe2, LayoutGrid, Map, Plug, Settings, Wrench } from 'lucide-react';
import { colors, icon, mobileNavItems, typography } from '../design/roboagentTokens';

const ICONS = {
  overview: LayoutGrid,
  dispatch: Wrench,
  map: Map,
  network: Globe2,
  integrations: Plug,
  settings: Settings,
};

export default function MobileBottomNav({ route, onNavigate, pendingCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[#1C1D21]/96 backdrop-blur-xl lg:hidden"
      aria-label="Primary navigation"
      style={{ borderColor: colors.border, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`grid ${mobileNavItems.length > 5 ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {mobileNavItems.map(({ id, label, routes }) => {
          const active = routes.includes(route);
          const Icon = ICONS[id];
          const showBadge = id === 'dispatch' && pendingCount > 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 px-0.5 pb-2 pt-2 transition active:scale-[0.98]"
            >
              {active && (
                <span
                  className="absolute inset-x-5 top-0 h-px"
                  style={{ backgroundColor: colors.primary, boxShadow: '0 0 10px rgba(91,168,160,0.45)' }}
                  aria-hidden="true"
                />
              )}
              <span className="relative flex h-8 w-8 items-center justify-center">
                <Icon
                  size={icon.nav}
                  strokeWidth={active ? icon.navStroke : icon.navStrokeIdle}
                  className="flex-shrink-0"
                  style={{ color: active ? colors.ink : colors.navIdle }}
                />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C45C4A] px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </span>
              <span
                className={`w-full max-w-[4.75rem] px-0.5 text-center ${typography.navLabel}`}
                style={{ color: active ? colors.navActiveLabel : colors.navIdle }}
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
