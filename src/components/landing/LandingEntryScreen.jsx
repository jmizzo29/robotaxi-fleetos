import { Loader2 } from 'lucide-react';
import LandingHeader from './LandingHeader';

export default function LandingEntryScreen({
  onNavigate,
  onConnect,
  connectLabel,
  connectDisabled = false,
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-black text-white">
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
  );
}
