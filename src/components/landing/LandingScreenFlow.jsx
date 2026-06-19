import DashboardPreview from '../DashboardPreview';
import LandingHeader from './LandingHeader';
import LandingHeroAmbience from './LandingHeroAmbience';
import BuiltForOwnersSection from './BuiltForOwnersSection';
import IndustryPositioningSection from './IndustryPositioningSection';

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

      {/* Hero — Fleet OS positioning */}
      <section className="relative overflow-hidden bg-black px-5 pb-10 pt-14 sm:pb-12">
        <LandingHeroAmbience />

        <div className="relative z-10 mx-auto w-full max-w-lg pt-4 sm:max-w-2xl sm:pt-6">
          <h1 className="text-[2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-[2.65rem] lg:text-5xl">
            The Fleet Operating System for Tesla Robotaxi Owners
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55 sm:mt-5 sm:text-base md:text-lg">
            Manage vehicles, maximize revenue, protect assets, and monitor your fleet from a single command center.
          </p>

          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className={`mt-6 w-full max-w-xs sm:w-auto ${connectButtonClass}`}
          >
            {connectLabel}
          </button>
        </div>

        <div id="command-preview" className="relative z-10 mx-auto mt-6 w-full max-w-md sm:mt-8">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-violet-500/20 blur-3xl" aria-hidden="true" />
          <DashboardPreview variant="compact" />
        </div>
      </section>

      <BuiltForOwnersSection />

      <IndustryPositioningSection
        onConnect={onConnect}
        connectLabel={connectLabel}
        connectDisabled={connectDisabled}
        connectButtonClass={connectButtonClass}
      />

      <section className="px-5 pb-16 pt-2 sm:pb-24">
        <p className="mx-auto max-w-md text-center text-[11px] text-white/25">
          Not affiliated with or endorsed by Tesla, Inc.
        </p>
      </section>
    </div>
  );
}
