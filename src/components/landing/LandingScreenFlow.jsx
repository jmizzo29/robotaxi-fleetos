import DashboardPreview from '../DashboardPreview';
import LandingHeader from './LandingHeader';
import LandingHeroAmbience from './LandingHeroAmbience';

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

      {/* Hero — product-first: copy + dashboard proof, no vehicle imagery */}
      <section className="relative overflow-hidden bg-black px-5 pb-10 pt-14 sm:pb-12">
        <LandingHeroAmbience />

        <div className="relative z-10 mx-auto w-full max-w-lg pt-4 sm:pt-6">
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

        <div id="command-preview" className="relative z-10 mx-auto mt-6 w-full max-w-md sm:mt-7">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-violet-500/20 blur-3xl" aria-hidden="true" />
          <DashboardPreview variant="compact" />
        </div>
      </section>

      <section className="px-5 pb-12 pt-2 sm:pb-16">
        <p className="mx-auto max-w-md text-center text-[13px] leading-relaxed text-white/35">
          Built for Tesla Owners, Turo Operators, and Future Cybercab Fleets.
        </p>
      </section>

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
