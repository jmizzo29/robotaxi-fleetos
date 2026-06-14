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
  getCommandAiPlan,
  getFleetActivityFeed,
} from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from '../../utils/vehicleDisplayUtils';
import { colors, icon, spacing, typography } from '../../design/roboagentTokens';

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

function CommandHeaderActions({ onNavigate }) {
  return (
    <>
      <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Notifications">
        <Bell className="h-[17px] w-[17px] text-slate-700" strokeWidth={icon.navStrokeIdle} />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white">
          2
        </span>
      </button>
      <button
        type="button"
        onClick={() => onNavigate('account')}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-200 shadow-sm"
        aria-label="Account"
      >
        <User className="h-[18px] w-[18px] text-slate-600" strokeWidth={icon.navStrokeIdle} />
      </button>
    </>
  );
}

function EarningsHeroCard({ hero }) {
  return (
    <section aria-label="Net earnings today">
      <HeroCardFrame className="px-5 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/80">Net Earnings Today</p>
            <p className={`mt-2 text-white ${typography.display}`}>{hero.amount}</p>
            {hero.delta ? (
              <p className="mt-2 text-[15px] font-semibold text-[#bbf7d0]">+18% vs Yesterday</p>
            ) : (
              <p className="mt-2 text-[14px] font-semibold text-white/80">{hero.hint || 'Sync fleet to track earnings'}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ade80]" />
              Live
            </span>
            <div className="h-14 w-[7rem]">
              <EarningsSparkline />
            </div>
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
              <p className="mt-2 text-[13px] font-medium text-slate-600">{card.sub}</p>
            </AppCard>
          );
        })}
      </div>
    </AppSection>
  );
}

function ActivityStatusIcon({ eventType }) {
  const shell = `flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]`;
  if (eventType === 'trip' || eventType === 'milestone') {
    return (
      <span className={`${shell} bg-[#ecfdf3] text-[#15803d]`}>
        <CircleDollarSign className="h-[18px] w-[18px]" strokeWidth={icon.stroke} />
      </span>
    );
  }
  if (eventType === 'surge') {
    return (
      <span className={`${shell} bg-[#eff6ff] text-[#2563eb]`}>
        <TrendingUp className="h-[18px] w-[18px]" strokeWidth={icon.stroke} />
      </span>
    );
  }
  if (eventType === 'offline') {
    return (
      <span className={`${shell} bg-[#fef2f2] text-[#dc2626]`}>
        <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={icon.stroke} />
      </span>
    );
  }
  return (
    <span className={`${shell} bg-[#fefce8] text-[#a16207]`}>
      <Zap className="h-[18px] w-[18px]" strokeWidth={icon.stroke} />
    </span>
  );
}

function impactClass(tone) {
  if (tone === 'positive') return 'text-[#15803d]';
  if (tone === 'surge') return 'text-[#2563eb]';
  if (tone === 'alert') return 'text-[#dc2626]';
  return 'text-slate-600';
}

function FleetActivitySection({ events }) {
  return (
    <AppSection title="Fleet Activity" tier="secondary">
      <ul className={spacing.stackSm}>
        {events.map((event) => (
          <li key={event.id}>
            <AppCard variant="subdued" className="flex items-center gap-3 px-3.5 py-3.5">
              <ActivityStatusIcon eventType={event.eventType} />
              <div className="min-w-0 flex-1">
                <p className={typography.body}>{event.description}</p>
                <p className={`mt-0.5 text-[13px] font-bold tabular-nums ${impactClass(event.impactTone)}`}>{event.impact}</p>
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
    <AppSection title="AI Operations Brief" actionLabel="Execute" onAction={() => onNavigate('ai')} tier="tertiary" className="pb-2">
      <AppCard variant="alert">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#2563eb]" strokeWidth={icon.stroke} />
          <p className={typography.sectionSm}>Prepared for your fleet</p>
        </div>
        <p className={`mt-3 ${typography.cardTitle}`}>{plan.summary}</p>
        <p className={`mt-2 ${typography.bodyMd} text-[#2563eb]`}>{plan.action}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className={typography.label}>Expected demand increase</p>
            <p className={`mt-1.5 ${typography.metricSm} text-[#2563eb]`}>{plan.demandIncrease}</p>
          </div>
          <div>
            <p className={typography.label}>Est. additional earnings</p>
            <p className={`mt-1.5 ${typography.metricSm} text-[#15803d]`}>{plan.expectedRevenueImpact}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] font-semibold text-slate-600">
          Confidence: <span className="text-[#2563eb]">{plan.confidenceLabel}</span>
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
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const hero = getCommandEarningsHero(realFleet, totalEarnings, syncState);
  const strip = getCommandFleetStatusStrip(fleet, realFleet);
  const activity = getFleetActivityFeed(fleet, realFleet, 5);
  const plan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue);
  const activeCount = Number(strip.active.value) || 0;
  const totalCount = strip.total || fleet.length;

  return (
    <AppShell>
      <AppHeader trailing={<CommandHeaderActions onNavigate={onNavigate} />} />

      <EarningsHeroCard hero={hero} />

      <CommandMapPreview
        fleet={fleet}
        realFleet={realFleet}
        onNavigate={onNavigate}
        activeCount={activeCount}
        totalCount={totalCount}
        mapHeightClass={MAP_HEIGHT}
        tier="primary"
      />

      <FleetActivitySection events={activity} />
      <FleetStatusGrid strip={strip} onNavigate={onNavigate} />
      <AiOperationsBrief plan={plan} onNavigate={onNavigate} />
    </AppShell>
  );
}
