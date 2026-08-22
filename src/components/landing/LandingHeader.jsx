import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import RoboLogo from '../RoboLogo';
import RoboWordmark from '../RoboWordmark';
import MonumentBetaBadge from '../monument/MonumentBetaBadge';
import { monument } from '../monument/monumentTokens';

export default function LandingHeader({ onNavigate, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const isEntry = variant === 'entry';
  const isMonument = variant === 'monument';
  const isCinematic = variant === 'cinematic';
  const homeRoute = 'landing';

  const go = (route) => {
    setOpen(false);
    onNavigate(route);
  };

  if (isMonument || isCinematic) {
    const cinematic = isCinematic;
    return (
      <>
        <header
          className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-5"
          style={{
            backgroundColor: cinematic ? 'transparent' : 'rgba(14,15,18,0.82)',
            backdropFilter: cinematic ? 'none' : 'blur(16px)',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <button
            type="button"
            onClick={() => go(homeRoute)}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            aria-label="ROBOAGENT home"
          >
            <RoboWordmark
              className="text-[0.95rem] tracking-[0.28em]"
              colorClass="text-white"
            />
            {!cinematic && <MonumentBetaBadge />}
          </button>

          <div className="w-10" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:text-white active:scale-[0.98]"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {open && (
          <button
            type="button"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: monument.scrim }}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
        )}

        <nav
          className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col px-6 pt-20 transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ backgroundColor: monument.canvas }}
          aria-hidden={!open}
        >
          <div className="flex flex-col">
            {[
              { route: 'how-it-works', label: 'How it works' },
              { route: 'about', label: 'About' },
            ].map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => go(item.route)}
                className="border-b border-white/10 py-4 text-left text-[15px] font-medium text-white/80 transition hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-black/40 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => go(homeRoute)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="ROBOAGENT home"
        >
          {isEntry ? (
            <RoboWordmark
              className="text-[1.0625rem] tracking-[0.28em] sm:text-[1.125rem]"
              colorClass="text-white"
            />
          ) : (
            <span className="flex items-center gap-2">
              <RoboLogo className="h-7 w-7 shrink-0 text-white" />
              <RoboWordmark className="text-[13px] tracking-[0.2em]" colorClass="text-white" />
            </span>
          )}
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
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col bg-[#0E0F12] px-6 pt-20 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col">
          {[
            { route: 'how-it-works', label: 'How it works' },
            { route: 'about', label: 'About' },
          ].map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => go(item.route)}
              className="border-b border-white/10 py-4 text-left text-[15px] font-medium text-white/80 transition hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
