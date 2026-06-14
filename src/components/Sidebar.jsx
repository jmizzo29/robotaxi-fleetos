import SignOutButton from './SignOutButton';
import RoboWordmark from './RoboWordmark';
import { colors, mobileNavItems, typography } from '../design/roboagentTokens';

export default function Sidebar({
  commandQueue = [],
  route = 'overview',
  onNavigate = () => {},
}) {
  return (
    <aside
      className="hidden w-72 flex-col border-r border-slate-200/90 bg-white lg:flex"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex-1 p-6">
        <div className="mb-10">
          <button type="button" onClick={() => onNavigate('overview')} className="text-left">
            <RoboWordmark className="text-[1.05rem] tracking-[0.04em]" colorClass={typography.wordmarkColor} />
          </button>
        </div>

        <nav className="space-y-1">
          {mobileNavItems.map(({ id, label, routes }) => {
            const active = routes.includes(route);
            const showBadge = id === 'dispatch' && commandQueue.length > 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                  active ? 'text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={active ? { backgroundColor: colors.primary } : undefined}
              >
                <span>{label}</span>
                {showBadge && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    {commandQueue.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200/90 p-6">
        <SignOutButton
          onSignedOut={() => onNavigate('landing')}
          className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          label="Sign out"
          compact
        />
      </div>
    </aside>
  );
}
