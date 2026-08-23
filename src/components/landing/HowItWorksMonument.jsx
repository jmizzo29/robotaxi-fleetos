import LandingHeader from './LandingHeader';
import LandingHeroAmbience from './LandingHeroAmbience';
import { monument, monumentType } from '../monument/monumentTokens';

const STEPS = [
  { step: '01', title: 'Connect your Tesla' },
  { step: '02', title: 'Get daily AI plans' },
  { step: '03', title: 'Approve what you want' },
];

export default function HowItWorksMonument({ onNavigate }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#1C1D21] text-[#F3F3F1]">
      <LandingHeroAmbience />
      <LandingHeader onNavigate={onNavigate} variant="cinematic" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <p className={monumentType.label} style={{ color: monument.navIdle }}>How it works</p>
          <p className={`mt-6 ${monumentType.monument} text-white`}>3</p>
          <p className="mt-5 text-[17px] font-normal tracking-[-0.01em] text-white/70">
            You approve everything.
          </p>
        </div>

        <div className="shrink-0">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="flex items-baseline justify-between gap-6 border-t border-white/10 py-4"
            >
              <p className={monumentType.label} style={{ color: monument.navIdle }}>{step.step}</p>
              <p className="text-right text-[15px] font-medium text-white">{step.title}</p>
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
            style={{ color: monument.navIdle }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
