import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import DashboardPreview from '../components/DashboardPreview';
import BuiltForOwnersSection from '../components/landing/BuiltForOwnersSection';
import IndustryPositioningSection from '../components/landing/IndustryPositioningSection';
import PricingValueSection from '../components/landing/PricingValueSection';

export default function Landing({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaAuth = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  const handleWatchDemo = () => {
    setMenuOpen(false);
    const el = document.getElementById('dashboard-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-6 md:relative md:h-[6.655rem] md:px-8">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="font-brand text-lg font-semibold tracking-[-0.3px] text-white transition hover:opacity-90 md:absolute md:left-0 md:top-0 md:flex md:h-[6.655rem] md:items-center md:pl-8 md:text-[1.66375rem] md:tracking-[-0.5px]"
          >
            AutoFleeto
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

          <div className="absolute right-0 top-0 hidden h-[6.655rem] items-center pr-8 md:flex">
            <button
              type="button"
              onClick={handleTeslaAuth}
              disabled={isTeslaLoading}
              className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {isTeslaLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Connecting…
                </span>
              ) : (
                'Continue with Tesla'
              )}
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
            onClick={() => { setMenuOpen(false); handleTeslaAuth(); }}
            disabled={isTeslaLoading}
            className="text-4xl font-semibold transition active:opacity-60 disabled:opacity-60"
          >
            {isTeslaLoading ? 'Connecting to Tesla…' : 'Continue with Tesla'}
          </button>
          <button
            type="button"
            onClick={handleWatchDemo}
            className="text-4xl font-semibold text-white/70 transition active:opacity-60"
          >
            Watch Demo
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-8 px-6 pb-12 pt-28 text-center md:gap-10 md:px-16 md:pb-16 md:pt-36">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="font-brand text-[2.25rem] font-bold leading-[1.08] tracking-[-1.5px] text-white sm:text-5xl md:text-6xl md:tracking-[-2px] lg:text-7xl">
            The Operating System for Tesla Fleet Owners
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:mt-6 md:text-xl">
            Track profit, utilization, charging, maintenance, and growth across your entire fleet.
            Connect your Tesla account and start managing your business in minutes.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
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
              'Continue with Tesla'
            )}
          </button>
          <button
            type="button"
            onClick={handleWatchDemo}
            className="w-full rounded-full border border-white/30 bg-black/40 py-[1.1rem] text-base font-semibold text-white transition hover:bg-white/10 active:scale-[0.985] sm:w-auto sm:px-8 sm:py-4"
          >
            Watch Demo
          </button>
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

      <BuiltForOwnersSection />
      <IndustryPositioningSection />
      <PricingValueSection onContinueWithTesla={handleTeslaAuth} isTeslaLoading={isTeslaLoading} />

    </div>
  );
}
