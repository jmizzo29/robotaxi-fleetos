import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import MonumentBetaBadge from '../monument/MonumentBetaBadge';
import { monument } from '../monument/monumentTokens';

const NAV_ITEMS = [
  { route: 'how-it-works', label: 'How it works' },
  { route: 'login', label: 'Sign in' },
  { route: 'about', label: 'About' },
];

export default function LandingHeader({
  onNavigate,
  variant = 'default',
  showBrand = true,
}) {
  const [open, setOpen] = useState(false);
  const isCinematic = variant === 'cinematic';
  const isMonument = variant === 'monument';
  const homeRoute = 'landing';

  const go = (route) => {
    setOpen(false);
    onNavigate(route);
  };

  const headerTone = isCinematic
    ? { backgroundColor: 'transparent', backdropFilter: 'none' }
    : isMonument
      ? { backgroundColor: 'rgba(28,29,33,0.88)', backdropFilter: 'blur(16px)' }
      : undefined;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-3 px-5 ${
          headerTone ? '' : 'bg-black/40 backdrop-blur-md'
        }`}
        style={{
          ...headerTone,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {showBrand ? (
          <button
            type="button"
            onClick={() => go(homeRoute)}
            className="relative z-10 flex min-w-0 shrink items-center gap-2 text-left"
            aria-label="ROBOAGENT home"
          >
            <RoboWordmark
              variant="header"
              className="truncate text-[0.78rem] sm:text-[0.88rem]"
              colorClass="text-white"
            />
            {isMonument && <MonumentBetaBadge />}
          </button>
        ) : (
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        )}

        <nav className="relative z-10 hidden min-w-0 items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => go(item.route)}
              className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/70 transition hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#C4C6CB] transition hover:text-white active:scale-[0.98] md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: monument.scrim }}
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <nav
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col px-6 pt-20 transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: monument.canvas }}
        aria-hidden={!open}
      >
        <div className="flex flex-col">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => go(item.route)}
              className="border-b border-white/10 py-4 text-left text-[15px] font-medium text-[#C4C6CB] transition hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
