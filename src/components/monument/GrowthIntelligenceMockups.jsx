import { ArrowUpRight, MapPin, Sparkles, Target, TrendingUp } from 'lucide-react';
import demandZones from '../../data/demandZones';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from '../../utils/networkIntelligenceUtils';
import { monument, monumentType } from './monumentTokens';

function optionAccent(option) {
  if (option === 'A') return monument.action;
  if (option === 'B') return monument.money;
  return monument.projected;
}

function getZonePosition(zone, index) {
  if (zone.name === 'Orlando Airport') return { left: '58%', top: '25%' };
  if (zone.name === 'Disney Corridor') return { left: '38%', top: '43%' };
  if (zone.name === 'Downtown Tampa') return { left: '18%', top: '56%' };
  if (zone.name === 'Miami Beach') return { left: '71%', top: '77%' };
  return { left: `${22 + index * 18}%`, top: `${30 + index * 12}%` };
}

function getZoneByName(name) {
  return demandZones.find((zone) => zone.name === name) || demandZones[0];
}

function getExpansionZoneStack() {
  const preferred = ['Orlando Airport', 'Disney Corridor', 'Downtown Tampa', 'Miami Beach']
    .map(getZoneByName);
  return [...new Map(preferred.map((zone) => [zone.name, zone])).values()];
}

function normalizeOpportunity(event) {
  if (!event) {
    return {
      title: 'Orlando Airport',
      place: 'High demand',
      demandLabel: '+15% demand',
      recommendation: 'Increase airport coverage after 4 PM',
    };
  }
  return event;
}

function MockupFrame({ option, title, children }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border"
      style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: monument.hairline }}>
        <div>
          <p className={monumentType.ledgerLabel} style={{ color: optionAccent(option) }}>
            Mockup {option}
          </p>
          <h3 className="mt-1 text-[18px] font-semibold leading-tight" style={{ color: monument.ink }}>
            {title}
          </h3>
        </div>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-bold"
          style={{
            color: optionAccent(option),
            borderColor: monument.hairline,
            backgroundColor: monument.canvas,
          }}
        >
          {option}
        </span>
      </div>
      {children}
    </article>
  );
}

function GrowthHero({ compact = false }) {
  return (
    <div className={compact ? 'px-4 pb-4 pt-5' : 'px-4 pb-5 pt-6'}>
      <p className={monumentType.label} style={{ color: monument.inkGhost }}>
        GROWTH INTELLIGENCE
      </p>
      <h2
        className={compact ? 'mt-3 text-[34px] font-bold leading-[0.95]' : 'mt-4 text-[42px] font-bold leading-[0.92]'}
        style={{ color: monument.ink }}
      >
        Where should I grow next?
      </h2>
      <p className="mt-4 text-[15px] leading-snug" style={{ color: monument.inkMuted }}>
        Discover demand opportunities, expansion zones, and ways to maximize fleet revenue.
      </p>
    </div>
  );
}

function PrimaryOpportunity({ expansion, event, tone = monument.action }) {
  const opportunity = normalizeOpportunity(event);
  return (
    <div className="mx-4 rounded-xl border p-4" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={monumentType.ledgerLabel} style={{ color: tone }}>
            Top Opportunity
          </p>
          <h4 className="mt-2 text-[24px] font-bold leading-none" style={{ color: monument.ink }}>
            {opportunity.title}
          </h4>
          <p className="mt-2 text-[13px] font-medium" style={{ color: monument.inkMuted }}>
            {opportunity.place} - {opportunity.demandLabel}
          </p>
        </div>
        <TrendingUp className="mt-1 h-5 w-5 shrink-0" style={{ color: tone }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <MetricPill label="Recommended" value={`+${expansion.deployCount} vehicles`} />
        <MetricPill label="Revenue lift" value={`${expansion.projectedLabel}/mo`} />
      </div>
      <p className="mt-4 text-[13px] leading-snug" style={{ color: monument.inkMuted }}>
        {opportunity.recommendation}.
      </p>
    </div>
  );
}

function MetricPill({ label, value, accent = monument.ink }) {
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: monument.inkGhost }}>
        {label}
      </p>
      <p className="mt-1 text-[15px] font-bold leading-tight" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function OpportunityMap({ zones = demandZones, large = false, focus = 'Opportunity Zones' }) {
  const sortedZones = [...zones].sort((a, b) => b.profitability - a.profitability).slice(0, large ? 4 : 3);
  return (
    <div className="mx-4 overflow-hidden rounded-xl border" style={{ borderColor: monument.hairline, backgroundColor: '#101318' }}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Opportunity Map
          </p>
          <p className="mt-1 text-[15px] font-bold text-white">{focus}</p>
        </div>
        <MapPin className="h-4 w-4 text-white/55" />
      </div>
      <div className={large ? 'relative h-[260px]' : 'relative h-[190px]'}>
        <div className="absolute inset-x-8 top-8 h-px bg-white/10" />
        <div className="absolute bottom-10 left-8 right-7 h-px bg-white/10" />
        <div className="absolute bottom-8 left-12 top-8 w-px bg-white/10" />
        <div className="absolute bottom-8 right-16 top-10 w-px bg-white/10" />
        <div className="absolute left-[16%] top-[18%] h-[66%] w-[60%] rounded-[42%] border border-white/12 bg-white/[0.03] rotate-[-18deg]" />
        <div className="absolute left-[35%] top-[14%] h-[72%] w-[33%] rounded-full border border-white/10 bg-white/[0.025] rotate-[16deg]" />
        {sortedZones.map((zone, index) => {
          const position = getZonePosition(zone, index);
          const size = 44 + Math.round((zone.demand - 70) * 1.2);
          return (
            <div
              key={zone.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              <span
                className="absolute left-1/2 top-1/2 rounded-full opacity-25 blur-sm"
                style={{
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  backgroundColor: zone.color,
                }}
              />
              <span
                className="relative flex h-4 w-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: zone.color }}
              />
              <div className="absolute left-5 top-1/2 min-w-[86px] -translate-y-1/2 rounded-lg border border-white/10 bg-black/55 px-2 py-1 backdrop-blur">
                <p className="text-[10px] font-bold leading-none text-white">{zone.name}</p>
                <p className="mt-1 text-[10px] font-semibold text-white/60">
                  {zone.demand} demand
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightList({ insights }) {
  return (
    <div className="space-y-2.5 px-4 pb-4">
      {insights.map((insight) => (
        <div
          key={insight.title}
          className="flex items-start gap-3 rounded-xl border px-3 py-3"
          style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}
        >
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: insight.tint || '#EBF2FF', color: insight.accent || monument.action }}
          >
            {insight.icon || <ArrowUpRight className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-tight" style={{ color: monument.ink }}>
              {insight.title}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: monument.inkMuted }}>
              {insight.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Scoreboard({ scores }) {
  return (
    <div className="space-y-2 px-4 pb-4">
      {scores.slice(0, 4).map((score, index) => (
        <div key={score.city} className="rounded-xl border px-3 py-3" style={{ borderColor: monument.hairline }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold" style={{ color: monument.ink }}>
                {index + 1}. {score.city}
              </p>
              <p className="text-[12px]" style={{ color: monument.inkMuted }}>
                Expansion confidence
              </p>
            </div>
            <p className="text-[22px] font-bold leading-none" style={{ color: index === 0 ? monument.money : monument.ink }}>
              {score.score}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: monument.hairline }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${score.score}%`, backgroundColor: index === 0 ? monument.money : monument.action }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function OptionA({ expansion, events }) {
  const topEvent = normalizeOpportunity(events.find((event) => event.id === 'airport-surge'));
  const airportZone = getZoneByName('Orlando Airport');
  const insights = [
    {
      title: 'Orlando Airport is the strongest next move',
      body: `${airportZone.demand} demand score with ${airportZone.profitability} profitability.`,
      icon: <Target className="h-4 w-4" />,
      accent: monument.action,
      tint: '#EAF0FF',
    },
    {
      title: 'Demand exceeds planned coverage',
      body: topEvent.recommendation,
      icon: <Sparkles className="h-4 w-4" />,
      accent: monument.projected,
      tint: '#FFF4D6',
    },
  ];

  return (
    <MockupFrame option="A" title="Advisor Brief">
      <GrowthHero />
      <PrimaryOpportunity expansion={expansion} event={topEvent} />
      <div className="py-4">
        <OpportunityMap focus="High Demand Corridors" />
      </div>
      <InsightList insights={insights} />
    </MockupFrame>
  );
}

function OptionB({ expansion, events }) {
  const topZones = getExpansionZoneStack();
  const strongest = getZoneByName('Orlando Airport');
  const event = normalizeOpportunity(events.find((item) => item.id === 'airport-surge') || events[0]);

  return (
    <MockupFrame option="B" title="Map First">
      <GrowthHero compact />
      <OpportunityMap zones={topZones} large focus="Demand + Expansion Zones" />
      <div className="grid grid-cols-2 gap-2.5 px-4 py-4">
        <MetricPill label="Best Zone" value={strongest.name.replace('Orlando ', '')} accent={monument.money} />
        <MetricPill label="Revenue Lift" value={`${expansion.projectedLabel}/mo`} accent={monument.money} />
      </div>
      <div className="mx-4 mb-4 rounded-xl border p-4" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
        <p className={monumentType.ledgerLabel} style={{ color: monument.money }}>
          Recommended Expansion
        </p>
        <h4 className="mt-2 text-[22px] font-bold leading-none" style={{ color: monument.ink }}>
          Add {expansion.deployCount} vehicles near {expansion.city}
        </h4>
        <p className="mt-3 text-[13px] leading-snug" style={{ color: monument.inkMuted }}>
          {event.recommendation}. Confidence: {expansion.confidenceLabel}.
        </p>
      </div>
    </MockupFrame>
  );
}

function OptionC({ expansion, events, scores }) {
  const insights = [
    {
      title: 'Airport coverage creates the clearest revenue path',
      body: `Adding ${expansion.deployCount} vehicles could add ${expansion.projectedLabel} in monthly revenue.`,
      icon: <TrendingUp className="h-4 w-4" />,
      accent: monument.money,
      tint: '#E7F4EE',
    },
    {
      title: 'Convention demand is expected to rise',
      body: normalizeOpportunity(events.find((event) => event.title.includes('Expo'))).recommendation,
      icon: <Sparkles className="h-4 w-4" />,
      accent: monument.projected,
      tint: '#FFF4D6',
    },
    {
      title: 'Tampa remains a secondary expansion play',
      body: 'Keep monitoring post-event demand before adding permanent capacity.',
      icon: <Target className="h-4 w-4" />,
      accent: monument.action,
      tint: '#EAF0FF',
    },
  ];

  return (
    <MockupFrame option="C" title="Expansion Playbook">
      <GrowthHero compact />
      <PrimaryOpportunity expansion={expansion} event={events[3] || events[0]} tone={monument.money} />
      <div className="px-4 pb-3 pt-4">
        <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>
          Market Ranking
        </p>
      </div>
      <Scoreboard scores={scores} />
      <InsightList insights={insights} />
    </MockupFrame>
  );
}

export default function GrowthIntelligenceMockups({ fleet = [] }) {
  const expansion = getExpansionRecommendation(fleet);
  const events = getNetworkOpportunities(fleet);
  const scores = getExpansionScoreboard();

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas }}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[430px] flex-col gap-4 pb-4">
          <div className="px-1 pb-1 pt-1">
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>
              Grow Page Mockups
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-none" style={{ color: monument.ink }}>
              Growth Intelligence Center
            </h1>
            <p className="mt-2 text-[13px] leading-snug" style={{ color: monument.inkMuted }}>
              Three mobile directions using current ROBOAGENT opportunity data.
            </p>
          </div>
          <OptionA expansion={expansion} events={events} />
          <OptionB expansion={expansion} events={events} />
          <OptionC expansion={expansion} events={events} scores={scores} />
        </div>
      </div>
    </div>
  );
}
