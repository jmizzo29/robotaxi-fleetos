import { useMemo } from 'react';
import { ClipboardList, TrendingUp } from 'lucide-react';
import { AppCard, AppHeader, AppSection, AppShell } from '../components/shell';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from '../utils/networkIntelligenceUtils';
import { colors, icon, spacing, typography } from '../design/roboagentTokens';

const opportunityToneClasses = {
  primary: 'border-l-[#2563eb]',
  success: 'border-l-[#15803d]',
  warning: 'border-l-[#a16207]',
};

function ExpansionScoreboard({ markets }) {
  return (
    <AppSection title="Expansion Scoreboard" tier="secondary" className="!mt-0">
      <ul className={spacing.stackSm}>
        {markets.map((market, index) => (
          <li key={market.id}>
            <AppCard className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[13px] font-bold text-[#2563eb]">
                  {index + 1}
                </span>
                <p className={typography.cardTitle}>{market.city}</p>
              </div>
              <div className="text-right">
                <p className={`${typography.metricSm} text-[#2563eb]`}>{market.score}</p>
                <p className={typography.label}>Opportunity Score</p>
              </div>
            </AppCard>
          </li>
        ))}
      </ul>
    </AppSection>
  );
}

function DemandEventsSection({ events }) {
  return (
    <AppSection title="Upcoming Demand Events" tier="secondary">
      <ul className={spacing.stackSm}>
        {events.map((item) => (
          <li key={item.id}>
            <AppCard
              variant="subdued"
              className={`border-l-[4px] px-4 py-4 ${opportunityToneClasses[item.tone] || opportunityToneClasses.primary}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={typography.cardTitle}>{item.title}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-500">{item.place}</p>
                </div>
                <p className="shrink-0 text-[15px] font-bold text-[#2563eb]">{item.demandLabel}</p>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-slate-600">{item.recommendation}</p>
            </AppCard>
          </li>
        ))}
      </ul>
    </AppSection>
  );
}

function AiExpansionSection({ expansion, onNavigate }) {
  return (
    <AppSection title="AI Expansion Recommendations" tier="tertiary" className="pb-2">
      <AppCard variant="alert">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#2563eb]" strokeWidth={icon.stroke} />
          <p className={typography.sectionSm}>Growth intelligence brief</p>
        </div>
        <p className={`mt-3 ${typography.cardTitle}`}>{expansion.deployLabel}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className={typography.label}>Expected monthly revenue increase</p>
            <p className={`mt-1.5 ${typography.metricSm} text-[#15803d]`}>{expansion.projectedLabel}</p>
          </div>
          <div>
            <p className={typography.label}>Confidence</p>
            <p className={`mt-1.5 ${typography.metricSm} text-[#2563eb]`}>{expansion.confidenceLabel}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-snug text-slate-600">{expansion.rationale}</p>
        <button
          type="button"
          onClick={() => onNavigate?.('finance')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#2563eb]/20 bg-[#eff6ff] px-4 py-3.5 text-[14px] font-semibold text-[#2563eb] transition active:bg-[#dbeafe]"
        >
          <TrendingUp className="h-4 w-4" strokeWidth={icon.stroke} />
          View expansion plan
        </button>
      </AppCard>
    </AppSection>
  );
}

export default function NetworkPanel({ fleet = [], onNavigate = () => {} }) {
  const scoreboard = useMemo(() => getExpansionScoreboard(), []);
  const events = useMemo(() => getNetworkOpportunities(fleet), [fleet]);
  const expansion = useMemo(() => getExpansionRecommendation(fleet), [fleet]);

  return (
    <AppShell>
      <AppHeader badge="Network" />
      <ExpansionScoreboard markets={scoreboard} />
      <DemandEventsSection events={events} />
      <AiExpansionSection expansion={expansion} onNavigate={onNavigate} />
    </AppShell>
  );
}
