import { Globe2, LayoutGrid, Map, Plug, Settings, Wrench } from 'lucide-react';
import { colors, icon, mobileNavItems, shadow, typography } from '../design/roboagentTokens';

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
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/98 backdrop-blur-lg lg:hidden ${shadow.nav}`}
      aria-label="Primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
              className="relative flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 px-0.5 pb-2 pt-2 transition active:scale-[0.98]"
            >
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-1 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                  active ? 'shadow-lg shadow-blue-500/30' : ''
                }`}
                style={{ backgroundColor: active ? colors.primary : 'transparent' }}
              >
                <Icon
                  size={icon.nav}
                  strokeWidth={active ? icon.navStroke : icon.navStrokeIdle}
                  className="flex-shrink-0"
                  style={{ color: active ? '#ffffff' : colors.inkSubtle }}
                />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </span>
              <span
                className={`w-full max-w-[4.75rem] px-0.5 text-center ${typography.navLabel} ${
                  active ? 'font-bold text-blue-800' : 'font-semibold text-slate-400'
                }`}
                style={active ? { color: colors.navActiveLabel } : undefined}
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
