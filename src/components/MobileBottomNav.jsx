import { useState } from 'react';
import { logoutFleetOsAccount } from '../services/sessionService';

function NavIcon({ type }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z',
    map: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',
    fleet: 'M5 11h14l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4l2-5Zm2-5h10l2 5H5l2-5Z',
    ai: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Zm6 10 1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1 1-2.7Z',
    more: 'M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d={paths[type]} fill="currentColor" />
    </svg>
  );
}

const items = [
  ['overview', 'home', 'Command'],
  ['map', 'map', 'Map'],
  ['ai', 'ai', 'Agent'],
  ['health', 'fleet', 'Health'],
  ['more', 'more', 'More'],
];

const menuSections = [
  {
    label: 'Core',
    items: [
      ['overview', 'Command', 'Owner dashboard'],
      ['map', 'Map', 'Vehicles and service areas'],
      ['ai', 'Agent', 'Ask and approve actions'],
      ['dispatch', 'Plan', 'Staging and pricing'],
    ],
  },
  {
    label: 'Fleet',
    items: [
      ['fleet', 'Vehicles', 'Registry'],
      ['health', 'Health', 'Maintenance and risk'],
      ['charging', 'Charging', 'Energy readiness'],
      ['finance', 'Money', 'Revenue and ROI'],
    ],
  },
  {
    label: 'Setup',
    items: [
      ['onboarding', 'Setup', 'Account and Tesla connect'],
      ['tesla', 'Tesla', 'API status'],
      ['integrations', 'Integrations', 'Connected systems'],
      ['account', 'Account', 'Profile and access'],
    ],
  },
  {
    label: 'Advanced',
    items: [
      ['alerts', 'Alerts', 'AI triage'],
      ['reports', 'Reports', 'Operations review'],
      ['settings', 'Settings', 'Runtime controls'],
      ['admin', 'Admin', 'Beta operations'],
    ],
  },
];

export default function MobileBottomNav({ route, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
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

  const signOut = async () => {
    setIsSigningOut(true);
    setIsOpen(false);
    onNavigate('landing');

    try {
      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
    } finally {
      setIsSigningOut(false);
    }
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={signOut}
                disabled={isSigningOut}
                className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-60"
              >
                {isSigningOut ? '...' : 'Sign Out'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
                aria-label="Close mobile menu"
              >
                X
              </button>
            </div>
          </div>

          <div className="max-h-[54vh] space-y-4 overflow-y-auto p-3">
            {menuSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {section.label}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {section.items.map(([id, label, detail]) => (
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
            ))}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/[0.12] bg-[linear-gradient(145deg,rgba(30,41,59,0.94),rgba(17,17,17,0.94))] p-1.5 shadow-2xl shadow-black/35 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map(([id, icon, label]) => {
            const active = id === 'more' ? isMoreActive || isOpen : route === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateMobile(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
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
