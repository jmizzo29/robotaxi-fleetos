import { useState } from 'react';
import { Home, Map, Bot, Car, MoreHorizontal } from 'lucide-react';
import RoboWordmark from './RoboWordmark';
import SignOutButton from './SignOutButton';

function NavIcon({ type }) {
  const icons = {
    home: Home,
    map: Map,
    ai: Bot,
    fleet: Car,
    more: MoreHorizontal,
  };
  const Icon = icons[type] || MoreHorizontal;
  return <Icon className="h-4 w-4" />;
}

const items = [
  ['overview', 'home', 'Command'],
  ['map', 'map', 'Map'],
  ['ai', 'ai', 'Agent'],
  ['fleet', 'fleet', 'Fleet'],
  ['more', 'more', 'More'],
];

const menuSections = [
  {
    label: 'Main',
    items: [
      ['overview', 'Command', 'Daily plan & actions'],
      ['map', 'Map', 'Live locations'],
      ['ai', 'Agent', 'Ask & approve'],
      ['fleet', 'Fleet', 'Vehicles overview'],
      ['finance', 'Money', 'Revenue & costs'],
      ['account', 'Account', 'Profile & Tesla'],
    ],
  },
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
        <div className="fixed inset-x-4 bottom-24 z-50 max-h-[68vh] overflow-hidden rounded-2xl border border-[#141b27]/10 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between border-b border-[#141b27]/10 px-4 py-3">
            <div>
              <p className="text-sm">
                <RoboWordmark />
              </p>
              <h2 className="text-lg font-black text-[#141b27]">Menu</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#141b27]/10 bg-slate-100 text-slate-700"
                aria-label="Close mobile menu"
              >
                X
              </button>
            </div>
          </div>

          <div className="max-h-[54vh] space-y-4 overflow-y-auto p-3">
            {menuSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
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
                          ? 'border-[#172231]/15 bg-[#172231] text-white'
                          : 'border-[#141b27]/10 bg-slate-50 text-slate-700 hover:border-[#141b27]/15 hover:bg-white'
                      }`}
                    >
                      <span className="block text-sm font-black">{label}</span>
                      <span className={`mt-1 block text-xs leading-5 ${route === id ? 'text-white/75' : 'text-slate-500'}`}>{detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-[#141b27]/10 bg-slate-50 p-3">
              <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Session
              </p>
              <SignOutButton
                compact
                onSignedOut={() => {
                  setIsOpen(false);
                  onNavigate('landing');
                }}
                className="w-full rounded-xl border border-[#141b27]/10 bg-white px-3 py-3 text-left text-sm font-black text-[#172231] transition hover:bg-slate-50"
                confirmClassName="bg-white"
                label="Sign out of this device"
              />
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-[#141b27]/10 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/20 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map(([id, icon, label]) => {
            const active = id === 'more' ? isMoreActive || isOpen : route === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateMobile(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
                  active ? 'bg-[#172231] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-black'
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
