import LandingHeader from './LandingHeader';
import LandingLegalLinks from './LandingLegalLinks';
import MonumentLaunchSignup from './MonumentLaunchSignup';
import { monument, monumentType } from '../monument/monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

function LedgerRow({ left, right }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b py-2.5 ${monumentType.monoSm}`}
      style={{ borderColor: monument.hairline }}
    >
      <span style={{ color: monument.inkGhost }}>{left}</span>
      <span className="text-right font-semibold" style={{ color: monument.inkMuted }}>{right}</span>
    </div>
  );
}

const ABOUT_ROWS = [
  ['built for', 'Tesla fleet owners'],
  ['program', 'Beta'],
  ['fleet size', '1 to 100+ Cybercabs'],
  ['data source', 'Tesla Fleet API'],
  ['you control', 'approve every action'],
];

export default function AboutMonument({ onNavigate }) {
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ backgroundColor: monument.canvas }}>
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>About</p>
          <p className={`mt-5 ${monumentType.monumentSm}`} style={{ color: monument.ink }}>
            ROBOAGENT
          </p>
          <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>
            Fleet OS for Tesla owners
          </p>
        </div>

        <div className="shrink-0 space-y-3">
          <div
            className="rounded-xl px-4 py-3.5"
            style={{ backgroundColor: monument.ledgerWash }}
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>Overview</p>
            <p className={`mt-2 ${monumentType.sheetBody} leading-relaxed`} style={{ color: monument.ink }}>
              One number for your fleet. One action when you are ready. Real Tesla telemetry — never vehicle controls without your approval.
            </p>
            <div className="mt-3">
              {ABOUT_ROWS.map(([left, right]) => (
                <LedgerRow key={left} left={left} right={right} />
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border px-4 py-1"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            <p className={`py-3 ${monumentType.label}`} style={{ color: monument.inkGhost }}>Legal</p>
            <LandingLegalLinks onNavigate={onNavigate} layout="stack" />
          </div>

          <Hairline />
          <div className="mt-4">
            <MonumentLaunchSignup />
          </div>
          <p className={`mt-4 text-center ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
            Not affiliated with or endorsed by Tesla, Inc.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className={`mt-4 w-full rounded-xl py-3.5 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98]`}
            style={{ backgroundColor: monument.action }}
          >
            Connect Tesla
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`mt-3 w-full py-2.5 ${monumentType.actionLink}`}
            style={{ color: monument.inkMuted }}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
