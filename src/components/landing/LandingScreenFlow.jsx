import DashboardPreview from '../DashboardPreview';
import LandingHeader from './LandingHeader';
import LandingHeroVisual from './LandingHeroVisual';

function scrollToPreview() {
  document.getElementById('command-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* Screen 1 — headline & CTA first, vehicle below, preview tease at fold */}
      <section className="relative min-h-[100dvh] overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[40%] bg-black sm:h-[38%]" aria-hidden="true" />
        <LandingHeroVisual />

        <div className="relative z-10 px-5 pt-14">
          <div className="relative mx-auto w-full max-w-lg pt-5 sm:pt-7">
            <div className="relative overflow-hidden rounded-2xl px-4 py-6 sm:px-5 sm:py-7">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/40"
                aria-hidden="true"
              />
              <div className="relative">
                <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                  Your Tesla Fleet.
                  <span className="mt-1 block text-white/70">One Command Center.</span>
                </h1>

                <button
                  type="button"
                  onClick={onConnect}
                  disabled={connectDisabled}
                  className={`mt-6 w-full max-w-xs sm:w-auto ${connectButtonClass}`}
                >
                  {connectLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product tease — slightly more visible at hero fold */}
      <div id="command-preview" className="relative z-20 -mt-[7.75rem] scroll-mt-14 px-5 sm:-mt-[8.75rem]">
        <button
          type="button"
          onClick={scrollToPreview}
          className="mx-auto mb-3 flex w-full max-w-md flex-col items-center gap-1 text-[12px] font-medium tracking-wide text-violet-300/80 transition hover:text-violet-200"
        >
          <span>See the Command Center</span>
          <span className="text-lg leading-none" aria-hidden="true">↓</span>
        </button>

        <div className="mx-auto max-w-md shadow-[0_-12px_40px_rgba(139,92,246,0.12)]">
          <DashboardPreview variant="compact" />
        </div>
      </div>

      {/* Screen 2 — product context */}
      <section className="px-5 pb-16 pt-8 sm:pb-20">
        <p className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-white/35">
          Built for Tesla Owners, Turo Operators, and Future Cybercab Fleets.
        </p>
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
