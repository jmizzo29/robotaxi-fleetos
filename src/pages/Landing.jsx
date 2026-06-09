import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import DashboardPreview from '../components/DashboardPreview';
import BuiltForOwnersSection from '../components/landing/BuiltForOwnersSection';
import IndustryPositioningSection from '../components/landing/IndustryPositioningSection';
import PricingValueSection from '../components/landing/PricingValueSection';
import DailyPlanSection from '../components/landing/DailyPlanSection';
import LandingFooter from '../components/landing/LandingFooter';

const trustItems = [
  'Secure Tesla OAuth',
  'Your password stays with Tesla',
  'You approve every action',
  'Revoke access anytime',
];

export default function Landing({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaAuth = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-6 md:relative md:h-[6.655rem] md:px-8">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-left transition hover:opacity-90 md:absolute md:left-0 md:top-0 md:flex md:h-[6.655rem] md:flex-col md:justify-center md:pl-8"
          >
            <span className="font-brand text-lg font-semibold tracking-[-0.3px] text-white md:text-[1.66375rem] md:tracking-[-0.5px]">
              AutoFleeto
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40 md:text-[11px]">
              Powered by ROBOAGENT
            </span>
          </button>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-[1.05rem] font-medium md:flex">
            <button type="button" onClick={() => onNavigate('about')} className="transition hover:text-white/70">
              About
            </button>
            <button type="button" onClick={() => onNavigate('how-it-works')} className="transition hover:text-white/70">
              How it Works
            </button>
            <button type="button" onClick={() => onNavigate('login')} className="transition hover:text-white/70">
              Sign In
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="text-2xl leading-none transition active:opacity-70 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-start justify-center gap-8 bg-black/95 px-8 md:hidden">
          <button type="button" onClick={() => { setMenuOpen(false); onNavigate('about'); }} className="text-4xl font-semibold transition active:opacity-60">
            About
          </button>
          <button type="button" onClick={() => { setMenuOpen(false); onNavigate('how-it-works'); }} className="text-4xl font-semibold transition active:opacity-60">
            How it Works
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onNavigate('login'); }}
            className="text-4xl font-semibold text-white/70 transition active:opacity-60"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-8 px-6 pb-12 pt-28 text-center md:gap-10 md:px-16 md:pb-16 md:pt-36">
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/45 sm:mb-6">
            Powered by ROBOAGENT
          </p>
          <h1 className="font-brand text-[2.25rem] font-bold leading-[1.08] tracking-[-1.5px] text-white sm:text-5xl md:text-6xl md:tracking-[-2px] lg:text-7xl">
            Run your Tesla like a business — even with one car.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:mt-6 md:text-xl">
            Track real profit, utilization, charging, and maintenance from live Tesla data.
            Get a daily action plan so your car earns more while you manage less.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/45">
            Works for Turo owners today and robotaxi operators tomorrow.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col items-center">
          <button
            type="button"
            onClick={handleTeslaAuth}
            disabled={isTeslaLoading}
            className="w-full rounded-full bg-blue-500 py-[1.1rem] text-base font-semibold text-white transition hover:bg-blue-400 active:scale-[0.985] disabled:opacity-60 sm:w-auto sm:px-8 sm:py-4"
          >
            {isTeslaLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Connecting…
              </span>
            ) : (
              'Connect Your Tesla Free'
            )}
          </button>
          <p className="mt-3 text-sm text-white/45">
            First Tesla Free During Beta · No Credit Card Required
          </p>

          <ul
            className="mt-6 flex w-full flex-wrap justify-center gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55 sm:gap-x-6 sm:text-sm"
            aria-label="Tesla connection security"
          >
            {trustItems.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span className="text-emerald-400/90" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dashboard preview */}
      <section
        id="dashboard-preview"
        className="scroll-mt-24 px-6 pb-16 md:px-16 md:pb-24"
      >
        <div className="mx-auto max-w-4xl">
          <DashboardPreview />
        </div>
      </section>

      <DailyPlanSection />
      <BuiltForOwnersSection />
      <IndustryPositioningSection />
      <PricingValueSection onContinueWithTesla={handleTeslaAuth} isTeslaLoading={isTeslaLoading} />
      <LandingFooter onNavigate={onNavigate} />

    </div>
  );
}
