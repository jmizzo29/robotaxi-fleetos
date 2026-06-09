import { useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import DashboardPreview from '../components/DashboardPreview';
import MobileHeroPreview from '../components/MobileHeroPreview';

// Official Tesla account portal — routes to Tesla SSO sign-up / sign-in.
const TESLA_ACCOUNT_URL = 'https://www.tesla.com/teslaaccount';

export default function Landing({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaAuth = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  // "Create Account" → official Tesla account creation portal in a new tab.
  const handleCreateAccount = () => {
    window.open(TESLA_ACCOUNT_URL, '_blank', 'noopener,noreferrer');
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
            RoboAgent
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white text-white/80 transition hover:border-white/70 hover:bg-white/10 disabled:opacity-60"
              aria-label="Sign in"
            >
              {isTeslaLoading ? <Loader2 size={18} className="animate-spin" /> : <User size={18} />}
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
          <button type="button" onClick={() => { setMenuOpen(false); handleTeslaAuth(); }} disabled={isTeslaLoading} className="text-4xl font-semibold transition active:opacity-60 disabled:opacity-60">
            {isTeslaLoading ? 'Connecting to Tesla…' : 'Sign In with Tesla'}
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); handleCreateAccount(); }}
            className="mt-4 w-full rounded-full bg-blue-500 py-4 text-lg font-semibold text-white transition hover:bg-blue-400 active:scale-[0.985]"
          >
            Create Account
          </button>
        </div>
      )}

      <section className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 pb-10 pt-24 text-center md:min-h-screen md:gap-12 md:px-16 md:pb-16 md:pt-32">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="font-brand mb-3 text-[3.25rem] font-bold leading-[1.05] tracking-[-2px] text-white md:mb-4 md:text-8xl md:leading-none md:tracking-[-4px]">
            RoboAgent
          </h1>
          <p className="text-lg leading-snug text-white/60 md:text-xl">
            Your Autonomous Robotaxi Fleet,
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            Commanded by AI
          </p>
        </div>

        {/* Live product preview — the actual RoboAgent dashboard, not a stock photo. */}
        <div className="w-full">
          {/* Desktop: dark Fleet Command dashboard card */}
          <div className="mx-auto hidden w-full max-w-4xl md:block">
            <DashboardPreview />
          </div>
          {/* Mobile: today's AI plan card (MobileHeroPreview is md:hidden by design). */}
          {/* Keep the whole hero on one screen: narrow + height-capped peek with a soft fade so the CTAs stay above the fold without scrolling. */}
          <div className="relative mx-auto max-h-[34svh] w-full max-w-[260px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_78%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_78%,transparent)] md:hidden">
            <MobileHeroPreview />
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <button
            type="button"
            onClick={handleCreateAccount}
            className="w-full rounded-full bg-blue-500 py-[1.1rem] text-base font-semibold text-white transition hover:bg-blue-400 active:scale-[0.985] sm:w-auto sm:px-8 sm:py-4"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={handleTeslaAuth}
            disabled={isTeslaLoading}
            className="w-full rounded-full border border-white/30 bg-black/40 py-[1.1rem] text-base font-semibold text-white transition hover:bg-white/10 active:scale-[0.985] disabled:opacity-60 sm:w-auto sm:px-8 sm:py-4"
          >
            {isTeslaLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Connecting…
              </span>
            ) : (
              'Sign In with Tesla'
            )}
          </button>
        </div>
      </section>

    </div>
  );
}
