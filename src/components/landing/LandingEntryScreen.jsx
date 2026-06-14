import { Loader2 } from 'lucide-react';
import LandingHeader from './LandingHeader';
import { monument, monumentType } from '../monument/monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

export default function LandingEntryScreen({
  onNavigate,
  onConnect,
  connectLabel,
  connectDisabled = false,
}) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col lg:bg-black lg:text-white"
      style={{ backgroundColor: monument.canvas }}
    >
      <div className="lg:hidden">
        <LandingHeader onNavigate={onNavigate} onConnect={onConnect} variant="monument" />

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className={monumentType.label} style={{ color: monument.projected }}>Projected</p>
            <p className={`mt-5 ${monumentType.monument}`} style={{ color: monument.money }}>
              $4,218
            </p>
            <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>
              10 Cybercabs · Orlando
            </p>
            <p className={`mt-3 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
              Illustrative preview
            </p>
          </div>

          <div className="shrink-0 text-center">
            <Hairline />
            <p className={`mt-6 ${monumentType.actionLine}`} style={{ color: monument.ink }}>
              Your Tesla fleet. One number. One action.
            </p>
            <button
              type="button"
              onClick={onConnect}
              disabled={connectDisabled}
              className={`mt-5 w-full rounded-xl py-3.5 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60`}
              style={{ backgroundColor: monument.action }}
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

            <p className={`mt-4 pb-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
              Fleet OS for Tesla owners
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden min-h-[100dvh] flex-col overflow-hidden bg-black text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(139,92,246,0.14),transparent_65%)]"
          aria-hidden="true"
        />

        <LandingHeader onNavigate={onNavigate} onConnect={onConnect} variant="entry" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-4">
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <h1 className="text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-[2.75rem]">
              Your Tesla Fleet.
              <span className="mt-1 block">One Command Center.</span>
            </h1>

            <button
              type="button"
              onClick={onConnect}
              disabled={connectDisabled}
              className="mt-10 w-full rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
            >
              {connectLabel}
            </button>

            <p className="mt-5 text-[0.825rem] font-medium tracking-[0.06em] text-white/50">
              Fleet Management OS for Tesla Owners
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
