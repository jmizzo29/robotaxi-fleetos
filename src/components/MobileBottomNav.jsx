import { Car, Globe2, LayoutGrid, User, Wrench } from 'lucide-react';
import { colors, icon, mobileNavItems, shadow, typography } from '../design/roboagentTokens';

const ICONS = {
  overview: LayoutGrid,
  fleet: Car,
  dispatch: Wrench,
  network: Globe2,
  account: User,
};

export default function MobileBottomNav({ route, onNavigate }) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/98 backdrop-blur-lg lg:hidden ${shadow.nav}`}
      aria-label="Primary navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {mobileNavItems.map(({ id, label, routes }) => {
          const active = routes.includes(route);
          const Icon = ICONS[id];

          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[4.35rem] min-w-0 flex-col items-center justify-center gap-1 px-0.5 pb-2 pt-2.5 transition active:scale-[0.98]"
            >
              {active && (
                <span
                  className="absolute inset-x-4 top-0 h-[3px] rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  aria-hidden="true"
                />
              )}
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors"
                style={{ backgroundColor: active ? colors.primaryLight : 'transparent' }}
              >
                <Icon
                  size={icon.nav}
                  strokeWidth={active ? icon.navStroke : icon.navStrokeIdle}
                  className="flex-shrink-0"
                  style={{ color: active ? colors.primary : colors.inkSubtle }}
                />
              </span>
              <span
                className={`w-full max-w-[4.5rem] px-0.5 text-center ${typography.navLabel} ${
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
