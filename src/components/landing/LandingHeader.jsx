import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '../Logo';

const navItems = [
  { label: 'How it works', route: 'how-it-works' },
  { label: 'Sign in', route: 'login' },
  { label: 'About', route: 'about' },
];

export default function LandingHeader({ onNavigate }) {
  const [open, setOpen] = useState(false);

  const go = (route) => {
    setOpen(false);
    onNavigate(route);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-black/80 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => go('landing')}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="ROBOAGENT home"
        >
          <Logo className="h-7" />
        </button>

        <div className="w-10" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <nav
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col bg-[#0a0a0a] px-6 pt-20 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1">
          {navItems.map(({ label, route }) => (
            <button
              key={route}
              type="button"
              onClick={() => go(route)}
              className="rounded-xl px-3 py-3.5 text-left text-[15px] font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go('onboarding')}
          className="mt-8 w-full rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-black transition hover:bg-white/90"
        >
          Connect Tesla
        </button>
      </nav>
    </>
  );
}
