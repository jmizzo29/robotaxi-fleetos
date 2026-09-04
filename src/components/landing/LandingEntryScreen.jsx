import { Loader2 } from 'lucide-react';
import LandingHeader from './LandingHeader';
import LandingHeroAmbience from './LandingHeroAmbience';
import LandingLegalLinks from './LandingLegalLinks';
import { monument, monumentType } from '../monument/monumentTokens';

export default function LandingEntryScreen({
  onNavigate,
  onConnect,
  connectDisabled = false,
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#1C1D21] text-[#F3F3F1]">
      <LandingHeroAmbience />
      <LandingHeader onNavigate={onNavigate} onConnect={onConnect} variant="cinematic" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-16">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <h1 className="max-w-[16ch] text-[clamp(3.4rem,14vw,8.4rem)] font-medium leading-[0.86] tracking-[-0.055em] text-white">
            ROBOAGENT
          </h1>
          <p className="mt-6 text-[17px] font-normal tracking-[-0.01em] text-white/70 sm:text-[19px]">
            Command your fleet.
          </p>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md shrink-0 text-center">
          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className="w-full rounded-full bg-white py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0E0F12] transition hover:bg-white/92 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
          >
            {connectDisabled ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Connecting…
              </span>
            ) : (
              'Connect Tesla'
            )}
          </button>
          <div className="mt-5 pb-1">
            <LandingLegalLinks onNavigate={onNavigate} layout="inline" />
          </div>
          <p className={`mt-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
            Not affiliated with Tesla, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
