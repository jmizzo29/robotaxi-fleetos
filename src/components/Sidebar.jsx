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
    <aside className="hidden w-[300px] flex-col border-r border-ink/10 bg-surface p-8 lg:flex">
      {/* Brand — calm and premium */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <RoboLogo className="h-8 w-8" />
          <div>
            <RoboWordmark className="text-lg" />
            <BetaBadge className="mt-0.5" />
          </div>
        </div>
      </div>

      {/* Navigation — spacious, elegant, labels always visible for clarity and ease of use */}
      <nav className="flex-1 space-y-1">
        {mainItems.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-[14px] text-left text-[15px] font-medium transition-all border-l-4 ${
                active
                  ? 'bg-surface-raised text-ink border-ink shadow-sm'
                  : 'text-ink-muted border-transparent hover:bg-surface-raised hover:text-ink hover:border-ink/20'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 transition ${active ? 'text-ink' : 'group-hover:text-ink'}`} />
              <span>{label}</span>
              {id === 'ai' && commandQueue.length > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
                  active ? 'bg-ink/20' : 'bg-ink/10'
                }`}>
                  {commandQueue.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom — clean sign out */}
      <div className="pt-6 border-t border-ink/10">
        <SignOutButton
          onSignedOut={() => onNavigate('landing')}
          className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition"
          label="Sign out"
        />
      </div>
    </aside>
  );
}
