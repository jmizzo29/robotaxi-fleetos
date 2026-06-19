import { Loader2 } from 'lucide-react';
import LandingHeader from './LandingHeader';
import LandingLegalLinks from './LandingLegalLinks';
import { monument, monumentType } from '../monument/monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

export default function LandingEntryScreen({
  onNavigate,
  onConnect,
  connectDisabled = false,
}) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col"
      style={{ backgroundColor: monument.canvas }}
    >
      <LandingHeader onNavigate={onNavigate} onConnect={onConnect} variant="monument" />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
          <h1 className="max-w-[340px] text-[29px] font-semibold leading-[1.04] tracking-tight" style={{ color: monument.ink }}>
            The Fleet Operating System for Tesla Robotaxi Owners
          </h1>
        </div>

        <div className="mx-auto w-full max-w-md shrink-0 text-center">
          <Hairline />
          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className={`mt-6 w-full rounded-xl py-3.5 text-[16.56px] font-bold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60`}
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
          <div className="mt-5 pb-1">
            <LandingLegalLinks onNavigate={onNavigate} layout="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
