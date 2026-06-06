import { Bot, Car, Home, Map, User, Wallet } from 'lucide-react';
import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';
import SignOutButton from './SignOutButton';
import BetaBadge from './BetaBadge';
import { StatusDot } from '../ui';

const mainItems = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'ai', label: 'Agent', icon: Bot },
  { id: 'fleet', label: 'Fleet', icon: Car },
  { id: 'finance', label: 'Money', icon: Wallet },
  { id: 'account', label: 'Account', icon: User },
];

export default function Sidebar({
  commandQueue = [],
  route = 'overview',
  onNavigate = () => {},
}) {
  return (
    <aside className="hidden w-[248px] flex-col border-r border-ink/10 bg-surface p-4 lg:flex xl:w-[260px]">
      <div className="mb-8 px-1">
        <div className="mb-3 flex items-center gap-2.5">
          <RoboLogo className="h-7 w-7 shrink-0" />
          <RoboWordmark className="text-sm" />
        </div>
        <h1 className="text-lg font-semibold text-ink">
          RoboAgent
          <BetaBadge className="ml-1.5 align-middle" />
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {mainItems.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {id === 'ai' && commandQueue.length > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-white/15 text-white' : 'bg-status-caution/15 text-status-caution'
                }`}>
                  {commandQueue.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {commandQueue.length > 0 && (
        <div className="mb-4 rounded-2xl border border-ink/10 bg-surface-raised p-3">
          <div className="mb-2 flex items-center gap-2">
            <StatusDot tone="caution" pulse />
            <p className="text-xs font-medium text-ink-muted">
              {commandQueue.length} pending {commandQueue.length === 1 ? 'action' : 'actions'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="text-xs font-medium text-status-active transition hover:text-ink"
          >
            Review in Agent →
          </button>
        </div>
      )}

      <SignOutButton
        onSignedOut={() => onNavigate('landing')}
        className="w-full rounded-xl border border-ink/10 bg-surface-raised px-3 py-2.5 text-left text-sm font-medium text-ink-muted transition hover:text-ink"
        label="Sign out"
      />
    </aside>
  );
}
