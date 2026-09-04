import {
  Activity,
  AlertTriangle,
  Bell,
  CircleDollarSign,
  ClipboardList,
  TrendingUp,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import CommandMapPreview from './CommandMapPreview';
import { AppCard, AppHeader, AppSection, AppShell, HeroCardFrame } from '../shell';
import {
  fleetStatusNeedsAttention,
  getCommandAiPlan,
  getCommandAlertCount,
  getFleetActivityFeed,
} from '../../utils/commandHomeUtils';
import { getExpansionRecommendation } from '../../utils/networkIntelligenceUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from '../../utils/vehicleDisplayUtils';
import { colors, icon, semantic, spacing, typography } from '../../design/roboagentTokens';

const MAP_HEIGHT = 'h-[420px]';

function EarningsSparkline() {
  const points = '4,38 18,28 32,34 46,18 60,24 74,12 88,16 100,8';
  return (
    <svg viewBox="0 0 104 44" className="h-full w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="0" y="43" fill="rgba(255,255,255,0.65)" fontSize="6" fontWeight="600">12 AM</text>
      <text x="78" y="43" fill="rgba(255,255,255,0.65)" fontSize="6" fontWeight="600">Now</text>
    </svg>
  );
}

function CommandHeaderActions({ onNavigate, alertCount }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('alerts')}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
        aria-label={alertCount > 0 ? `${alertCount} fleet alerts` : 'Fleet alerts'}
      >
        <Bell className="h-[17px] w-[17px] text-[#F3F3F1]" strokeWidth={icon.navStrokeIdle} />
        {alertCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: colors.error }}
          >
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onNavigate('account')}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5"
        aria-label="Account"
      >
        <User className="h-[18px] w-[18px] text-[#8B8E94]" strokeWidth={icon.navStrokeIdle} />
      </button>
    </>
  );
}

function EarningsHeroCard({ hero }) {
  const liveLabel = hero.liveLabel || 'Live';
  const isProjected = Boolean(hero.operational);

  return (
    <section aria-label={hero.label}>
      <HeroCardFrame className="px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isProjected ? (
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border-2 border-amber-200/70 bg-amber-300/25 px-3 py-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-50">
                  Projected — not verified
                </span>
              </div>
            ) : (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/90">
                  Verified Tesla revenue
                </span>
              </div>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/80">{hero.label}</p>
            <p className={`mt-2 text-white ${isProjected ? 'text-[3rem] font-bold leading-[0.92] tracking-[-0.04em]' : typography.display}`}>
              {hero.amount}
            </p>
            {hero.delta ? (
              <p className="mt-2 text-[15px] font-semibold" style={{ color: colors.heroDelta }}>{hero.delta}</p>
            ) : hero.hint ? (
              <p className="mt-2 text-[14px] font-semibold text-white/80">{hero.hint}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: colors.heroPulse }}
              />
              {liveLabel}
            </span>
            {!hero.operational && (
              <div className="h-14 w-[7rem]">
                <EarningsSparkline />
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-white/25 pt-4">
          {[
            { value: hero.trips, label: 'Trips' },
            { value: hero.teslaShare, label: 'Tesla Share' },
            { value: hero.netMargin || '—', label: 'Net Margin' },
          ].map((item, index) => (
            <div key={item.label} className={`text-center ${index === 1 ? 'border-x border-white/20' : ''}`}>
              <p className="text-[28px] font-bold leading-none text-white">{item.value}</p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </HeroCardFrame>
    </section>
  );
}

function CommandActionBar({ plan, alertCount, onNavigate }) {
  return (
    <section aria-label="Next operator action" className={spacing.sectionPrimary}>
      <AppCard variant="alert">
        <p className={typography.label}>Do this now</p>
        <p className={`mt-1.5 ${typography.cardTitle}`}>{plan.action}</p>
        <p className="mt-2 text-sm font-normal text-[#8B8E94]">{plan.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('dispatch')}
            className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.99]"
            style={{ backgroundColor: colors.primary }}
          >
            Execute in Operations →
          </button>
          {alertCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="rounded-full border border-white/12 bg-transparent px-4 py-2.5 text-sm font-medium text-[#F3F3F1] transition active:scale-[0.99]"
            >
              Review {alertCount} alert{alertCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </AppCard>
    </section>
  );
}

const STATUS_CONFIG = {
  active: { label: 'Active', icon: Activity, accent: colors.success, bg: colors.successBg },
  charging: { label: 'Charging', icon: Zap, accent: colors.warning, bg: colors.warningBg },
  service: { label: 'Service', icon: Wrench, accent: colors.service, bg: colors.serviceBg },
  offline: { label: 'Offline', icon: AlertTriangle, accent: colors.error, bg: colors.errorBg },
};

function FleetStatusGrid({ strip, onNavigate }) {
  const cards = ['active', 'charging', 'service', 'offline'].map((key) => ({
    key,
    ...STATUS_CONFIG[key],
    value: strip[key].value,
    sub: strip[key].sub,
  }));

  return (
    <AppSection title="Fleet Status" actionLabel="View all" onAction={() => onNavigate('fleet')} tier="secondary">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <AppCard
              key={card.key}
              as="button"
              type="button"
              variant="metric"
              onClick={() => onNavigate(card.key === 'charging' ? 'charging' : 'fleet')}
              className="transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className={typography.sectionSm}>{card.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: card.bg }}>
                  <Icon className="h-4 w-4" style={{ color: card.accent }} strokeWidth={icon.strokeBold} aria-hidden="true" />
                </span>
              </div>
              <p className={`mt-2.5 ${typography.metric}`} style={{ color: card.accent }}>{card.value}</p>
              <p className="mt-2 text-[13px] font-normal text-[#8B8E94]">{card.sub}</p>
            </AppCard>
          );
        })}
      </div>
    </AppSection>
  );
}

function FleetStatusCompact({ strip, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate('fleet')}
      className="flex w-full items-center justify-between gap-3 border-t border-white/[0.08] px-1 py-3.5 text-left transition active:opacity-70"
    >
      <p className={typography.bodyMd}>
        {strip.active.value} active · {strip.charging.value} charging · fleet healthy
      </p>
      <span className="shrink-0 text-[13px] font-semibold" style={{ color: colors.primary }}>
        Fleet →
      </span>
    </button>
  );
}

const ACTIVITY_ICON = {
  trip: { bg: semantic.positiveBg, text: semantic.positive },
  milestone: { bg: semantic.positiveBg, text: semantic.positive },
  surge: { bg: semantic.surgeBg, text: semantic.surge },
  offline: { bg: semantic.alertBg, text: semantic.alert },
  charging: { bg: semantic.cautionBg, text: semantic.caution },
};

function ActivityStatusIcon({ eventType }) {
  const shell = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]';
  const palette = ACTIVITY_ICON[eventType] || ACTIVITY_ICON.charging;
  const Icon = eventType === 'trip' || eventType === 'milestone'
    ? CircleDollarSign
    : eventType === 'surge'
      ? TrendingUp
      : eventType === 'offline'
        ? AlertTriangle
        : Zap;

  return (
    <span className={shell} style={{ backgroundColor: palette.bg, color: palette.text }}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={icon.stroke} />
    </span>
  );
}

function impactStyle(tone) {
  if (tone === 'positive') return { color: semantic.positive };
  if (tone === 'surge') return { color: semantic.surge };
  if (tone === 'alert') return { color: semantic.alert };
  return undefined;
}

function GrowthSignal({ expansion, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate('network')}
      className="flex w-full items-center justify-between gap-3 border-t border-white/[0.08] px-1 py-3.5 text-left transition active:opacity-70"
    >
      <div className="min-w-0">
        <p className={typography.label}>Where to grow next</p>
        <p className={`mt-1 ${typography.bodyMd}`}>
          {expansion.city} · +${expansion.projectedDaily}/day potential
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-semibold" style={{ color: colors.primary }}>
        Network →
      </span>
    </button>
  );
}

function FleetActivitySection({ events }) {
  if (!events.length) {
    return (
      <AppSection title="Fleet Activity" tier="primary">
        <AppCard variant="subdued">
          <p className={typography.body}>No trips yet</p>
          <p className="mt-1 text-[13px] text-[#8B8E94]">Activity appears after verified Tesla or ledger trips.</p>
        </AppCard>
      </AppSection>
    );
  }

  return (
    <AppSection title="Fleet Activity" tier="primary">
      <ul className={spacing.stackSm}>
        {events.map((event) => (
          <li key={event.id}>
            <AppCard variant="subdued" className="flex items-center gap-3 px-3.5 py-3.5">
              <ActivityStatusIcon eventType={event.eventType} />
              <div className="min-w-0 flex-1">
                <p className={typography.body}>{event.description}</p>
                <p className="mt-0.5 text-[13px] font-bold tabular-nums" style={impactStyle(event.impactTone)}>
                  {event.impact}
                </p>
              </div>
              <p className={`shrink-0 ${typography.caption}`}>{event.timestamp}</p>
            </AppCard>
          </li>
        ))}
      </ul>
    </AppSection>
  );
}

function AiOperationsBrief({ plan, onNavigate }) {
  return (
    <AppSection title="AI Operations Brief" actionLabel="Operations" onAction={() => onNavigate('dispatch')} tier="tertiary" className="pb-2">
      <AppCard variant="subdued">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" style={{ color: colors.primary }} strokeWidth={icon.stroke} />
          <p className={typography.sectionSm}>Prepared for your fleet</p>
        </div>
        <p className={`mt-3 ${typography.bodyMd}`}>{plan.summary}</p>
        <p className="mt-3 text-[13px] font-medium text-[#8B8E94]">
          Confidence: <span style={{ color: colors.primary }}>{plan.confidenceLabel}</span>
          {' · '}
          Est. impact: <span style={{ color: semantic.positive }}>{plan.expectedRevenueImpact}</span>
        </p>
      </AppCard>
    </AppSection>
  );
}

export default function FleetCommandHome({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  aiAnalysis = null,
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const hero = getCommandEarningsHero(fleet, realFleet, totalEarnings, syncState);
  const strip = getCommandFleetStatusStrip(fleet, realFleet, totalEarnings, syncState);
  const activity = getFleetActivityFeed(fleet, realFleet, 5, totalEarnings, syncState);
  const plan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings);
  const expansion = getExpansionRecommendation(fleet);
  const activeCount = Number(strip.active.value) || 0;
  const totalCount = strip.total || fleet.length;
  const alertCount = getCommandAlertCount({ aiAnalysis, commandQueue, strip });
  const showStatusGrid = fleetStatusNeedsAttention(strip);

  return (
    <AppShell>
      <AppHeader trailing={<CommandHeaderActions onNavigate={onNavigate} alertCount={alertCount} />} />

      <EarningsHeroCard hero={hero} />

      <CommandActionBar plan={plan} alertCount={alertCount} onNavigate={onNavigate} />

      <CommandMapPreview
        fleet={fleet}
        realFleet={realFleet}
        totalEarnings={totalEarnings}
        syncState={syncState}
        onNavigate={onNavigate}
        activeCount={activeCount}
        totalCount={totalCount}
        mapHeightClass={MAP_HEIGHT}
        tier="primary"
      />

      <FleetActivitySection events={activity} />

      <div className={spacing.sectionTertiary}>
        <GrowthSignal expansion={expansion} onNavigate={onNavigate} />
      </div>

      {showStatusGrid ? (
        <FleetStatusGrid strip={strip} onNavigate={onNavigate} />
      ) : (
        <div className={spacing.sectionSecondary}>
          <FleetStatusCompact strip={strip} onNavigate={onNavigate} />
        </div>
      )}

      <AiOperationsBrief plan={plan} onNavigate={onNavigate} />
    </AppShell>
  );
}
