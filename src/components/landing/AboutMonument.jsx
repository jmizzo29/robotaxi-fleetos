import LandingHeader from './LandingHeader';
import LandingLegalLinks from './LandingLegalLinks';
import { monument, monumentType } from '../monument/monumentTokens';

function Hairline() {
  return (
    <div className="mx-auto my-0 h-px w-6" style={{ backgroundColor: monument.hairline }} />
  );
}

export default function AboutMonument({ onNavigate }) {
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ backgroundColor: monument.canvas }}>
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex flex-1 flex-col justify-center">
          <article className="space-y-4 text-left">
            <h1 className={monumentType.sheetTitle} style={{ color: monument.ink }}>
              About ROBOAGENT
            </h1>
            <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
              In 2026, Tesla announced that eligible Tesla owners and future Cybercab owners would be able to place vehicles on the Robotaxi Network and earn revenue.
            </p>
            <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
              ROBOAGENT was built for this new era of vehicle ownership.
            </p>
            <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
              As vehicles become income-producing assets, owners need more than a vehicle app. They need a way to monitor their fleet, track revenue, protect assets, and identify growth opportunities.
            </p>
            <p className={monumentType.sheetBody} style={{ color: monument.ink }}>
              Tesla manages the vehicles.
            </p>
            <p className={monumentType.sheetBody} style={{ color: monument.ink }}>
              ROBOAGENT helps owners manage the business.
            </p>
            <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
              Whether you own one Tesla or a fleet of future Cybercabs, ROBOAGENT gives you a single command center to operate, grow, and profit from your transportation business.
            </p>
            <p className={`${monumentType.actionLine} font-semibold`} style={{ color: monument.money }}>
              Operate. Grow. Profit.
            </p>
          </article>
        </div>

        <div className="shrink-0 space-y-3">
          <div
            className="rounded-xl border px-4 py-1"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            <p className={`py-3 ${monumentType.label}`} style={{ color: monument.inkGhost }}>Legal</p>
            <LandingLegalLinks onNavigate={onNavigate} layout="stack" />
          </div>

          <Hairline />
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
