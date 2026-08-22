import LandingHeader from './LandingHeader';
import { monument, monumentType } from '../monument/monumentTokens';

const STEPS = [
  { step: '01', title: 'Connect your Tesla' },
  { step: '02', title: 'Get daily AI plans' },
  { step: '03', title: 'Approve what you want' },
];

export default function HowItWorksMonument({ onNavigate }) {
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ backgroundColor: monument.canvas }}>
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>How it works</p>
          <p className={`mt-6 ${monumentType.monument}`} style={{ color: monument.ink }}>3</p>
          <p className={`mt-5 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>
            steps · you approve everything
          </p>
        </div>

        <div className="shrink-0 space-y-0">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="flex items-baseline justify-between gap-6 border-t py-4"
              style={{ borderColor: monument.hairline }}
            >
              <p className={monumentType.label} style={{ color: monument.inkGhost }}>{step.step}</p>
              <p className={`${monumentType.sheetBody} text-right font-medium`} style={{ color: monument.ink }}>
                {step.title}
              </p>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className="mt-8 w-full rounded-full bg-white py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0E0F12] transition active:scale-[0.98]"
          >
            Connect Tesla
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`mt-3 w-full py-2.5 ${monumentType.actionLink}`}
            style={{ color: monument.inkMuted }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
