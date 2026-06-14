import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import RoboLogo from '../RoboLogo';
import RoboWordmark from '../RoboWordmark';
import LandingHowItWorksCard from './LandingHowItWorksCard';
import MonumentBetaBadge from '../monument/MonumentBetaBadge';
import { monument, monumentType } from '../monument/monumentTokens';

export default function LandingHeader({ onNavigate, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const isEntry = variant === 'entry';
  const isMonument = variant === 'monument';
  const homeRoute = 'landing';

  const go = (route) => {
    setOpen(false);
    onNavigate(route);
  };

  if (isMonument) {
    return (
      <>
        <header
          className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-5 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(250,250,248,0.92)',
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
              className="text-[1.275rem] tracking-[0.15em]"
              colorClass="text-[#12141A]"
            />
            <MonumentBetaBadge />
          </button>

          <div className="w-10" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-[0.98]"
            style={{ color: monument.inkMuted }}
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
          className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col px-6 pt-20 shadow-2xl transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ backgroundColor: monument.canvas }}
          aria-hidden={!open}
        >
          <div className="flex flex-col gap-1">
            <LandingHowItWorksCard onClick={() => go('how-it-works')} />

            <div className="my-4 h-px" style={{ backgroundColor: monument.hairline }} />

            <button
              type="button"
              onClick={() => go('about')}
              className={`rounded-xl px-3 py-3.5 text-left ${monumentType.sheetBody} transition active:bg-black/[0.03]`}
              style={{ color: monument.ink }}
            >
              About
            </button>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-black/80 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => go(homeRoute)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="ROBOAGENT home"
        >
          {isEntry ? (
            <RoboWordmark
              className="text-[1.0625rem] tracking-[0.15em] sm:text-[1.125rem]"
              colorClass="text-white"
            />
          ) : (
            <span className="flex items-center gap-2">
              <RoboLogo className="h-7 w-7 shrink-0 text-white" />
              <RoboWordmark className="text-[13px] tracking-[0.12em]" colorClass="text-white" />
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
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col bg-[#0a0a0a] px-6 pt-20 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => go('how-it-works')}
            className="rounded-xl border px-3 py-3.5 text-left transition hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">How it works</p>
            <p className="mt-1.5 text-[15px] font-semibold text-white">3 steps · you approve</p>
          </button>

          <div className="my-3 h-px bg-white/10" />

          <button
            type="button"
            onClick={() => go('about')}
            className="rounded-xl px-3 py-3.5 text-left text-[15px] font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            About
          </button>
        </div>
      </nav>
    </>
  );
}
