import { useState } from 'react';

function NavIcon({ type }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z',
    map: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',
    fleet: 'M5 11h14l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4l2-5Zm2-5h10l2 5H5l2-5Z',
    ai: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Zm6 10 1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1 1-2.7Z',
    more: 'M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d={paths[type]} fill="currentColor" />
    </svg>
  );
}

const items = [
  ['overview', 'home', 'Home'],
  ['map', 'map', 'Map'],
  ['fleet', 'fleet', 'Fleet'],
  ['dispatch', 'ai', 'Plan'],
  ['more', 'more', 'More'],
];

const menuItems = [
  ['overview', 'Overview', 'Live operations dashboard'],
  ['onboarding', 'Onboarding', 'Signup and Tesla connection'],
  ['map', 'Fleet Map', 'Your vehicles, status, battery, and health'],
  ['fleet', 'Fleet', 'Vehicle registry'],
  ['vehicle', 'Vehicle Detail', 'Selected vehicle view'],
  ['assets', 'Assets', 'Ownership and asset records'],
  ['finance', 'Finance', 'ROI and owner economics'],
  ['health', 'Fleet Health', 'Earnings, cleaning, and maintenance'],
  ['charging', 'Charging', 'Battery and dispatch readiness'],
  ['dispatch', 'Dispatch', 'Nightly staging planner'],
  ['readiness', 'Readiness', 'Driverless readiness scoring'],
  ['ai', 'AI Command', 'Recommendations and one-click actions'],
  ['alerts', 'Alerts', 'AI alert triage'],
  ['memory', 'Memory', 'Fleet event history'],
  ['reports', 'Reports', 'Operations intelligence'],
  ['integrations', 'Integrations', 'Connected services'],
  ['tesla', 'Tesla API', 'Capabilities and controls'],
  ['account', 'Account', 'Signup, login, and plan status'],
  ['settings', 'Settings', 'Admin controls'],
  ['admin', 'Beta Admin', 'Feedback and tester status'],
  ['privacy', 'Privacy', 'Data collection and deletion'],
  ['terms', 'Terms', 'Beta terms and boundaries'],
];

export default function MobileBottomNav({ route, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const primaryRouteIds = new Set(items.map(([id]) => id).filter((id) => id !== 'more'));
  const isMoreActive = !primaryRouteIds.has(route);

  const navigateMobile = (id) => {
    if (id === 'more') {
      setIsOpen((current) => !current);
      return;
    }

    setIsOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 z-50 max-h-[68vh] overflow-hidden rounded-2xl border border-white/[0.12] bg-[linear-gradient(145deg,rgba(30,41,59,0.96),rgba(17,17,17,0.96))] shadow-2xl shadow-black/40 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">RoboAgent</p>
              <h2 className="text-lg font-black text-slate-100">Menu</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
              aria-label="Close mobile menu"
            >
              X
            </button>
          </div>

          <div className="grid max-h-[54vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
            {menuItems.map(([id, label, detail]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateMobile(id)}
                className={`rounded-xl border p-3 text-left transition ${
                  route === id
                    ? 'border-sky-400/30 bg-sky-400/10 text-sky-100'
                    : 'border-white/10 bg-white/[0.07] text-slate-100 hover:border-white/20 hover:bg-white/[0.12]'
                }`}
              >
                <span className="block text-sm font-black">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-300">{detail}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/[0.12] bg-[linear-gradient(145deg,rgba(30,41,59,0.94),rgba(17,17,17,0.94))] p-2 shadow-2xl shadow-black/35 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map(([id, icon, label]) => {
            const active = id === 'more' ? isMoreActive || isOpen : route === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateMobile(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-sky-400/10 text-sky-300' : 'text-slate-300 hover:bg-white/[0.07] hover:text-sky-300'
                }`}
              >
                <NavIcon type={icon} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
