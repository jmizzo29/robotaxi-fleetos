import { useMemo } from 'react';
import { ClipboardList, TrendingUp } from 'lucide-react';
import RoboWordmark from '../components/RoboWordmark';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from '../utils/networkIntelligenceUtils';

const CARD = 'rounded-[20px] border border-slate-200/90 bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)]';
const SECTION_GAP = 'mt-6';

const opportunityToneClasses = {
  primary: 'border-l-[#2563eb]',
  success: 'border-l-[#15803d]',
  warning: 'border-l-[#a16207]',
};

function SectionHead({ title, tier = 'secondary' }) {
  const titleClass = tier === 'secondary'
    ? 'text-[18px] font-bold tracking-[-0.02em] text-slate-800'
    : 'text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500';

  return (
    <div className="mb-3">
      <h2 className={titleClass}>{title}</h2>
    </div>
  );
}

function ExpansionScoreboard({ markets }) {
  return (
    <section aria-label="Expansion scoreboard">
      <SectionHead title="Expansion Scoreboard" />
      <ul className="space-y-2.5">
        {markets.map((market, index) => (
          <li
            key={market.id}
            className={`flex items-center justify-between gap-3 ${CARD} px-4 py-4`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[13px] font-bold text-[#2563eb]">
                {index + 1}
              </span>
              <p className="text-[17px] font-bold text-slate-950">{market.city}</p>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold tabular-nums text-[#2563eb]">{market.score}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Opportunity Score</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DemandEventsSection({ events }) {
  return (
    <section className={SECTION_GAP} aria-label="Upcoming demand events">
      <SectionHead title="Upcoming Demand Events" />
      <ul className="space-y-2.5">
        {events.map((item) => (
          <li
            key={item.id}
            className={`${CARD} border-l-[4px] px-4 py-4 shadow-[0_4px_18px_-16px_rgba(15,23,42,0.22)] ${opportunityToneClasses[item.tone] || opportunityToneClasses.primary}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-bold text-slate-950">{item.title}</p>
                <p className="mt-0.5 text-[13px] font-medium text-slate-500">{item.place}</p>
              </div>
              <p className="shrink-0 text-[15px] font-bold text-[#2563eb]">{item.demandLabel}</p>
            </div>
            <p className="mt-2 text-[13px] font-semibold text-slate-600">{item.recommendation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiExpansionSection({ expansion, onNavigate }) {
  return (
    <section className={SECTION_GAP} aria-label="AI expansion recommendations">
      <SectionHead title="AI Expansion Recommendations" tier="tertiary" />
      <div className={`${CARD} border-l-[4px] border-l-[#2563eb] p-4 shadow-[0_4px_20px_-18px_rgba(15,23,42,0.2)]`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#2563eb]" strokeWidth={2.2} />
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Growth intelligence brief</p>
        </div>
        <p className="mt-3 text-[18px] font-bold leading-snug text-slate-950">{expansion.deployLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Expected monthly revenue increase</p>
            <p className="mt-1.5 text-[24px] font-bold tabular-nums text-[#15803d]">{expansion.projectedLabel}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Confidence</p>
            <p className="mt-1.5 text-[24px] font-bold text-[#2563eb]">{expansion.confidenceLabel}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-snug text-slate-600">{expansion.rationale}</p>
        <button
          type="button"
          onClick={() => onNavigate?.('finance')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#2563eb]/20 bg-[#eff6ff] px-4 py-3.5 text-[14px] font-semibold text-[#2563eb] transition active:bg-[#dbeafe]"
        >
          <TrendingUp className="h-4 w-4" strokeWidth={2.2} />
          View expansion plan
        </button>
      </div>
    </section>
  );
}

export default function NetworkPanel({ fleet = [], onNavigate = () => {} }) {
  const scoreboard = useMemo(() => getExpansionScoreboard(), []);
  const events = useMemo(() => getNetworkOpportunities(fleet), [fleet]);
  const expansion = useMemo(() => getExpansionRecommendation(fleet), [fleet]);

  return (
    <div className="min-h-screen bg-[#f3f4f8] px-4 pb-[5.5rem] pt-2 text-slate-900">
      <header className="mb-4 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1.05rem] tracking-[0.04em]" colorClass="text-[#1e3a8a]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">Growth Intel</p>
      </header>

      <ExpansionScoreboard markets={scoreboard} />
      <DemandEventsSection events={events} />
      <AiExpansionSection expansion={expansion} onNavigate={onNavigate} />
    </div>
  );
}
