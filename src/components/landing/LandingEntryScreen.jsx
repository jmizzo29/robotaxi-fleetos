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

        <div className="mx-auto w-full max-w-md shrink-0 text-center">
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
  );
}
