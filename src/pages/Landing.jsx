import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import DashboardPreview from '../components/DashboardPreview';
import LandingHeader from '../components/landing/LandingHeader';

function scrollToPreview() {
  document.getElementById('command-preview')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing({ onNavigate }) {
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaAuth = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  const connectButtonLabel = isTeslaLoading ? (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 size={18} className="animate-spin" />
      Connecting…
    </span>
  ) : (
    'Connect Tesla'
  );

  const connectButtonClass =
    'rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60';

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeader onNavigate={onNavigate} onConnect={handleTeslaAuth} />

      {/* Screen 1 — cinematic hero (100vh) */}
      <section className="relative flex min-h-[100dvh] flex-col px-5 pt-14">
        <div className="relative z-10 mx-auto w-full max-w-lg flex-1 pt-10 sm:pt-14">
          <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
            Your Tesla Fleet.
            <span className="mt-1 block text-white/55">One Command Center.</span>
          </h1>

          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-white/45">
            Monitor vehicles.
            <br />
            Track performance.
            <br />
            Manage operations.
          </p>

          <button
            type="button"
            onClick={handleTeslaAuth}
            disabled={isTeslaLoading}
            className={`mt-8 w-full max-w-xs sm:w-auto ${connectButtonClass}`}
          >
            {connectButtonLabel}
          </button>
        </div>

        <div className="relative mt-auto flex min-h-[42vh] items-end justify-center pb-16 sm:min-h-[45vh]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(168,85,247,0.35),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <img
            src="/vehicles/tesla-sedan-hero.svg"
            alt=""
            className="relative z-10 w-full max-w-xl object-contain object-bottom drop-shadow-[0_0_48px_rgba(168,85,247,0.35)]"
          />
        </div>

        <button
          type="button"
          onClick={scrollToPreview}
          className="absolute inset-x-0 bottom-6 z-20 mx-auto flex flex-col items-center gap-1 text-[12px] font-medium tracking-wide text-violet-300/80 transition hover:text-violet-200"
        >
          <span>See the Command Center</span>
          <span className="text-lg leading-none" aria-hidden="true">↓</span>
        </button>
      </section>

      {/* Screen 2 — Fleet Command preview */}
      <section id="command-preview" className="scroll-mt-14 px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-md">
          <DashboardPreview variant="compact" />
          <p className="mt-10 text-center text-[13px] leading-relaxed text-white/35">
            Built for Tesla Owners, Turo Operators, and Future Cybercab Fleets.
          </p>
        </div>
      </section>

      {/* Screen 3 — final CTA */}
      <section className="px-5 pb-16 pt-4 sm:pb-24">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-white sm:text-3xl">
            Ready to take control?
          </h2>
          <button
            type="button"
            onClick={handleTeslaAuth}
            disabled={isTeslaLoading}
            className={`mt-8 w-full sm:w-auto sm:min-w-[220px] ${connectButtonClass}`}
          >
            {connectButtonLabel}
          </button>
          <p className="mt-10 text-[11px] text-white/25">
            Not affiliated with or endorsed by Tesla, Inc.
          </p>
        </div>
      </section>
    </div>
  );
}
