import { monument, monumentType } from '../monument/monumentTokens';

const STEPS = [
  { step: '01', label: 'Connect Tesla', value: 'OAuth' },
  { step: '02', label: 'Daily AI plan', value: 'brief' },
  { step: '03', label: 'You approve', value: 'always' },
];

export default function LandingHowItWorksCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border px-4 py-4 text-left transition active:scale-[0.99]"
      style={{
        borderColor: monument.hairline,
        backgroundColor: monument.ledgerWash,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>How it works</p>
          <p className={`mt-2 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>
            3 steps. You stay in control.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 ${monumentType.revealHint}`}
          style={{ color: monument.action, backgroundColor: monument.surface }}
        >
          See →
        </span>
      </div>

      <div className={`mt-3.5 ${monumentType.monoSm}`}>
        {STEPS.map((row) => (
          <div
            key={row.step}
            className="flex items-center justify-between gap-3 border-t py-2"
            style={{ borderColor: monument.hairline }}
          >
            <span style={{ color: monument.inkGhost }}>{row.step}</span>
            <span className="min-w-0 flex-1 truncate" style={{ color: monument.ink }}>{row.label}</span>
            <span className="font-semibold" style={{ color: monument.money }}>{row.value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
