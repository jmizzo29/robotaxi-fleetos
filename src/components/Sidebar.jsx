import SignOutButton from './SignOutButton';
import RoboWordmark from './RoboWordmark';
import MonumentBetaBadge from './monument/MonumentBetaBadge';
import { colors, mobileNavItems, typography } from '../design/roboagentTokens';

export default function Sidebar({
  commandQueue = [],
  route = 'overview',
  onNavigate = () => {},
}) {
  return (
    <aside
      className="hidden w-64 flex-col border-r border-white/[0.08] bg-[#0E0F12] lg:flex"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex-1 px-6 py-7">
        <div className="mb-14">
          <button type="button" onClick={() => onNavigate('overview')} className="text-left">
            <RoboWordmark className="text-[0.92rem] tracking-[0.28em]" colorClass={typography.wordmarkColor} />
            <MonumentBetaBadge className="mt-3" />
          </button>
        </div>

        <nav className="space-y-0.5">
          {mobileNavItems.map(({ id, label, routes }) => {
            const active = routes.includes(route);
            const showBadge = id === 'dispatch' && commandQueue.length > 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="flex w-full items-center justify-between px-1 py-3 text-left text-[13px] font-medium uppercase tracking-[0.16em] transition"
                style={{ color: active ? colors.ink : colors.navIdle }}
              >
                <span>{label}</span>
                {showBadge && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {commandQueue.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.08] px-6 py-6">
        <SignOutButton
          onSignedOut={() => onNavigate('landing')}
          className="w-full py-2 text-left text-[12px] font-medium uppercase tracking-[0.16em] text-[#C4C6CB] transition hover:text-[#F3F3F1]"
          label="Sign out"
          compact
        />
      </div>
    </aside>
  );
}
