import { Bot, Car, Home, Map, User, Wallet } from 'lucide-react';
import RoboLogo from './RoboLogo';
import RoboWordmark from './RoboWordmark';
import SignOutButton from './SignOutButton';
import BetaBadge from './BetaBadge';

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
    <aside className="hidden w-20 flex-col border-r border-ink/10 bg-surface p-3 lg:flex">
      {/* Brand — ultra minimal, logo only */}
      <div className="mb-8 flex justify-center pt-2">
        <div className="flex flex-col items-center">
          <RoboLogo className="h-7 w-7" />
          <div className="mt-1 text-[9px] font-mono tracking-[1.5px] text-ink-muted">RA</div>
        </div>
      </div>

      {/* Navigation — icon-first, calm vertical rail. Labels only on active for extreme simplicity */}
      <nav className="flex-1 space-y-1 flex flex-col items-center">
        {mainItems.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                active
                  ? 'bg-ink text-white'
                  : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
              }`}
              aria-label={label}
            >
              <Icon className={`h-5 w-5 transition ${active ? 'text-white' : 'group-hover:text-ink'}`} />
              {active && (
                <span className="mt-0.5 text-[9px] font-medium tracking-tight">{label}</span>
              )}
              {id === 'ai' && commandQueue.length > 0 && (
                <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-status-caution text-[8px] font-bold flex items-center justify-center text-white">
                  {commandQueue.length}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom — tiny sign out icon only */}
      <div className="flex justify-center pb-2">
        <SignOutButton
          onSignedOut={() => onNavigate('landing')}
          className="flex h-9 w-9 items-center justify-center rounded-2xl text-ink-muted hover:bg-surface-raised hover:text-ink"
          label=""
        >
          <User className="h-4 w-4" />
        </SignOutButton>
      </div>
    </aside>
  );
}
