import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CircleDollarSign,
  TrendingUp,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import {
  getCommandAiPlan,
  getFleetActivityFeed,
} from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from '../../utils/vehicleDisplayUtils';

const MAP_HEIGHT = 'h-[380px]';

function SectionHead({ title, actionLabel, onAction, live = false }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-950">{title}</h2>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#2563eb]/20 bg-[#eff6ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#2563eb]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2563eb]" />
            Live
          </span>
        )}
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-[#2563eb]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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

function EarningsHeroCard({ hero }) {
  return (
    <section aria-label="Net earnings today">
      <div
        className="relative overflow-hidden rounded-[22px] border border-white/25 px-4 pb-4 pt-3.5 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.65)]"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 48%, #7c3aed 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/85">Net Earnings Today</p>
            <p className="mt-1.5 text-[3.75rem] font-bold leading-[0.92] tracking-[-0.04em] text-white">
              {hero.amount}
            </p>
            {hero.delta ? (
              <p className="mt-1.5 text-[14px] font-semibold text-[#bbf7d0]">+18% vs Yesterday</p>
            ) : (
              <p className="mt-1.5 text-[13px] font-semibold text-white/80">{hero.hint || 'Sync fleet to track earnings'}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ade80]" />
              Live
            </span>
            <div className="h-14 w-[7rem]">
              <EarningsSparkline />
            </div>
          </div>
        </div>

        <div className="relative mt-3.5 grid grid-cols-3 gap-2 border-t border-white/25 pt-3">
          <div className="text-center">
            <p className="text-[26px] font-bold leading-none text-white">{hero.trips}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70">Trips</p>
          </div>
          <div className="text-center border-x border-white/20">
            <p className="text-[26px] font-bold leading-none text-white">{hero.teslaShare}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70">Tesla Share</p>
          </div>
          <div className="text-center">
            <p className="text-[26px] font-bold leading-none text-white">{hero.netMargin || '—'}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70">Net Margin</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const STATUS_CONFIG = {
  active: { label: 'Active', icon: Activity, accent: 'text-[#15803d]', bg: 'bg-[#ecfdf3]' },
  charging: { label: 'Charging', icon: Zap, accent: 'text-[#a16207]', bg: 'bg-[#fefce8]' },
  service: { label: 'Service', icon: Wrench, accent: 'text-[#c2410c]', bg: 'bg-[#fff7ed]' },
  offline: { label: 'Offline', icon: AlertTriangle, accent: 'text-[#dc2626]', bg: 'bg-[#fef2f2]' },
};

function FleetStatusGrid({ strip, onNavigate }) {
  const cards = ['active', 'charging', 'service', 'offline'].map((key) => ({
    key,
    ...STATUS_CONFIG[key],
    value: strip[key].value,
    sub: strip[key].sub,
  }));

  return (
    <section className="mt-5" aria-label="Fleet status">
      <SectionHead title="Fleet Status" actionLabel="View all" onAction={() => onNavigate('fleet')} />
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onNavigate(card.key === 'charging' ? 'charging' : 'fleet')}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_4px_20px_-14px_rgba(15,23,42,0.35)] transition active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.accent}`} strokeWidth={2.3} aria-hidden="true" />
                </span>
              </div>
              <p className={`mt-2 text-[36px] font-bold leading-none tabular-nums ${card.accent}`}>{card.value}</p>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-600">{card.sub}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActivityStatusIcon({ eventType }) {
  if (eventType === 'trip' || eventType === 'milestone') {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ecfdf3] text-[#15803d]">
        <CircleDollarSign className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  if (eventType === 'surge') {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eff6ff] text-[#2563eb]">
        <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  if (eventType === 'offline') {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fef2f2] text-[#dc2626]">
        <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fefce8] text-[#a16207]">
      <Zap className="h-5 w-5" strokeWidth={2.2} />
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
    <section className="mt-5" aria-label="Fleet activity">
      <SectionHead title="Fleet Activity" live />
      <ul className="space-y-2.5">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_6px_22px_-16px_rgba(15,23,42,0.35)]"
          >
            <ActivityStatusIcon eventType={event.eventType} />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold leading-snug text-slate-950">{event.description}</p>
              <p className={`mt-0.5 text-[14px] font-bold tabular-nums ${impactClass(event.impactTone)}`}>{event.impact}</p>
            </div>
            <p className="shrink-0 text-[11px] font-medium text-slate-400">{event.timestamp}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiOperationsBrief({ plan, onNavigate }) {
  return (
    <section className="mt-5 pb-1" aria-label="AI Operations Brief">
      <SectionHead title="AI Operations Brief" actionLabel="Execute" onAction={() => onNavigate('ai')} />
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef2ff] text-[#4f46e5]">
            <Bot className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-snug text-slate-950">{plan.summary}</p>
            <p className="mt-2 text-[14px] font-semibold text-[#2563eb]">{plan.action}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Expected demand increase</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums text-[#2563eb]">{plan.demandIncrease}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Est. additional earnings</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums text-[#15803d]">{plan.expectedRevenueImpact}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] font-semibold text-slate-500">
              Confidence: <span className="text-[#2563eb]">{plan.confidenceLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
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
    <div className="min-h-screen bg-[#f3f4f8] px-4 pb-28 pt-1.5 text-slate-900">
      <header className="mb-3 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1.05rem] tracking-[0.04em]" colorClass="text-[#1e3a8a]" />
        <div className="flex items-center gap-2">
          <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Notifications">
            <Bell className="h-[17px] w-[17px] text-slate-700" strokeWidth={2} />
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
            <User className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
          </button>
        </div>
      </header>

      <EarningsHeroCard hero={hero} />
      <FleetActivitySection events={activity} />

      <div className="mt-5">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          onNavigate={onNavigate}
          activeCount={activeCount}
          totalCount={totalCount}
          mapHeightClass={MAP_HEIGHT}
        />
      </div>

      <FleetStatusGrid strip={strip} onNavigate={onNavigate} />
      <AiOperationsBrief plan={plan} onNavigate={onNavigate} />
    </div>
  );
}
