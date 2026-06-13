import { Loader2 } from 'lucide-react';
import RoboLogo from '../RoboLogo';
import RoboWordmark from '../RoboWordmark';

export default function LandingEntryScreen({ onConnect, connectLabel, connectDisabled = false }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(139,92,246,0.14),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="flex items-center gap-[0.78125rem]">
          <RoboLogo className="h-[2.8125rem] w-[2.8125rem] shrink-0 text-white" />
          <RoboWordmark className="text-[1.171875rem] tracking-[0.14em]" colorClass="text-white" />
        </div>

        <h1 className="mt-12 text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-[2.75rem]">
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

        <p className="mt-5 text-[11px] font-medium tracking-[0.08em] text-white/50">
          Beta · First Vehicle Free
        </p>
      </div>
    </div>
  );
}
