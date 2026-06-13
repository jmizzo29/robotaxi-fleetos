import DashboardPreview from '../DashboardPreview';
import LandingHeader from './LandingHeader';
import LandingHeroVisual from './LandingHeroVisual';

function scrollToPreview() {
  document.getElementById('command-preview')?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingScreenFlow({
  onNavigate,
  onConnect,
  connectLabel,
  connectDisabled = false,
  connectButtonClass = 'rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60',
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeader onNavigate={onNavigate} onConnect={onConnect} />

      {/* Screen 1 — hero + preview peek */}
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden px-5 pt-14">
        <div className="relative z-10 mx-auto w-full max-w-lg pt-6 sm:pt-8">
          <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
            Your Tesla Fleet.
            <span className="mt-1 block text-white/55">One Command Center.</span>
          </h1>

          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/45">
            See your fleet.
            <br />
            Know what needs attention.
            <br />
            Take action.
          </p>

          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className={`mt-5 w-full max-w-xs sm:w-auto ${connectButtonClass}`}
          >
            {connectLabel}
          </button>

          <LandingHeroVisual />
        </div>

        <button
          type="button"
          onClick={scrollToPreview}
          className="relative z-20 mx-auto mb-3 mt-2 flex flex-col items-center gap-1 text-[12px] font-medium tracking-wide text-violet-300/80 transition hover:text-violet-200"
        >
          <span>See the Command Center</span>
          <span className="text-lg leading-none" aria-hidden="true">↓</span>
        </button>

        <div
          className="pointer-events-none relative z-10 mx-auto mt-auto w-full max-w-md overflow-hidden"
          style={{ height: '7rem' }}
          aria-hidden="true"
        >
          <div className="opacity-75">
            <DashboardPreview variant="compact" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" aria-hidden="true" />
        </div>
      </section>

      {/* Screen 2 — full Fleet Command preview */}
      <section id="command-preview" className="-mt-1 scroll-mt-14 px-5 pb-16 pt-2 sm:pb-20">
        <div className="mx-auto max-w-md">
          <DashboardPreview variant="compact" />
          <p className="mt-10 text-center text-[13px] leading-relaxed text-white/35">
            Built for Tesla Owners, Turo Operators, and Future Cybercab Fleets.
          </p>
        </div>
      </section>

      {/* Screen 3 — final CTA */}
      <section className="px-5 pb-16 pt-2 sm:pb-24">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-3xl">
            Start with one Tesla.
            <span className="mt-1 block text-white/55">Scale to a fleet.</span>
          </h2>
          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className={`mt-8 w-full sm:w-auto sm:min-w-[220px] ${connectButtonClass}`}
          >
            {connectLabel}
          </button>
          <p className="mt-10 text-[11px] text-white/25">
            Not affiliated with or endorsed by Tesla, Inc.
          </p>
        </div>
      </section>
    </div>
  );
}
