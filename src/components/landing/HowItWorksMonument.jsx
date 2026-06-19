import LandingHeader from './LandingHeader';
import { monument, monumentType } from '../monument/monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

function LedgerRow({ left, right, tone = 'neutral' }) {
  const rightColor = tone === 'positive' ? monument.money : monument.inkMuted;
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b py-2.5 ${monumentType.monoSm}`}
      style={{ borderColor: monument.hairline }}
    >
      <span style={{ color: monument.inkGhost }}>{left}</span>
      <span className="font-semibold text-right" style={{ color: rightColor }}>{right}</span>
    </div>
  );
}

const STEPS = [
  { step: '01', title: 'Connect your Tesla' },
  { step: '02', title: 'Get daily AI plans' },
  { step: '03', title: 'Approve what you want' },
];

const TELEMETRY_ROWS = [
  ['battery', 'level · range · charging'],
  ['location', 'position · speed · heading'],
  ['fleet health', 'odometer · software · alerts'],
];

export default function HowItWorksMonument({ onNavigate }) {
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ backgroundColor: monument.canvas }}>
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>How it works</p>
          <p className={`mt-5 ${monumentType.monument}`} style={{ color: monument.money }}>3</p>
          <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>
            steps · you approve everything
          </p>
        </div>

        <div className="shrink-0 space-y-3">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border px-4 py-3.5"
              style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={monumentType.label} style={{ color: monument.inkGhost }}>{step.step}</p>
                <p className={`${monumentType.sheetBody} font-semibold`} style={{ color: monument.ink }}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}

          <div
            className="rounded-xl px-4 py-3.5"
            style={{ backgroundColor: monument.ledgerWash }}
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>Telemetry</p>
            <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.ink }}>
              Official Tesla Fleet API only.
            </p>
            <div className="mt-2">
              {TELEMETRY_ROWS.map(([left, right]) => (
                <LedgerRow key={left} left={left} right={right} tone="positive" />
              ))}
            </div>
          </div>

          <Hairline />
          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className={`mt-5 w-full rounded-xl py-3.5 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98]`}
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
