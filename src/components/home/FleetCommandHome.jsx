import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Car,
  CircleDollarSign,
  TrendingUp,
  Truck,
  User,
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

const MAP_HEIGHT = 'h-[284px]';

function SectionHead({ title, actionLabel, onAction }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="text-[20px] font-bold tracking-[-0.03em] text-slate-950">{title}</h2>
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

function EarningsHeroCard({ hero, totalEarnings }) {
  const gross = Math.round(totalEarnings || 0);
  const sharePct = gross > 0
    ? Math.round((Number(String(hero.teslaShare).replace(/[^\d]/g, '')) / gross) * 100)
    : 30;

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
            <p className="mt-1.5 text-[3.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-white">
              {hero.amount}
            </p>
            {hero.delta ? (
              <p className="mt-1.5 text-[13px] font-semibold text-[#bbf7d0]">▲ 18% vs yesterday</p>
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

        <div className="relative mt-3.5 grid grid-cols-2 gap-3 border-t border-white/25 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
              <Car className="h-[17px] w-[17px]" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[28px] font-bold leading-none text-white">{hero.trips}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-white/75">Trips today</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
              T
            </span>
            <div>
              <p className="text-[26px] font-bold leading-none text-white">{hero.teslaShare}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-white/75">Tesla share · {sharePct || 30}%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STATUS_ICONS = {
  active: Activity,
  charging: Zap,
  offline: AlertTriangle,
  total: Truck,
};

function FleetStatusGrid({ strip, onNavigate }) {
  const total = strip.total || 0;
  const cards = [
    { key: 'active', label: 'Active', value: strip.active.value, icon: STATUS_ICONS.active, accent: 'text-[#15803d]' },
    { key: 'charging', label: 'Charging', value: strip.charging.value, icon: STATUS_ICONS.charging, accent: 'text-[#a16207]' },
    { key: 'offline', label: 'Offline', value: strip.offline.value, icon: STATUS_ICONS.offline, accent: 'text-[#dc2626]' },
    { key: 'total', label: 'Total', value: String(total), icon: STATUS_ICONS.total, accent: 'text-[#1e40af]' },
  ];

  return (
    <section className="mt-4" aria-label="Fleet status">
      <SectionHead title="Fleet Status" actionLabel="View all" onAction={() => onNavigate('fleet')} />
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onNavigate(card.key === 'charging' ? 'charging' : 'fleet')}
              className="rounded-[16px] border border-slate-200 bg-white px-1.5 py-3 text-center shadow-[0_4px_16px_-12px_rgba(15,23,42,0.35)] transition active:scale-[0.98]"
            >
              <Icon className={`mx-auto h-4 w-4 ${card.accent}`} strokeWidth={2.3} aria-hidden="true" />
              <p className={`mt-2 text-[30px] font-bold leading-none tabular-nums ${card.accent}`}>{card.value}</p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActivityStatusIcon({ eventType }) {
  if (eventType === 'trip') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#ecfdf3] text-[#15803d]">
        <CircleDollarSign className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  if (eventType === 'surge') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#eff6ff] text-[#2563eb]">
        <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fefce8] text-[#a16207]">
      <Zap className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

function impactClass(tone) {
  if (tone === 'positive') return 'text-[#15803d]';
  if (tone === 'surge') return 'text-[#2563eb]';
  return 'text-slate-600';
}

function FleetActivitySection({ events }) {
  return (
    <section className="mt-4" aria-label="Fleet activity">
      <SectionHead title="Fleet Activity" />
      <ul className="space-y-2">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_18px_-14px_rgba(15,23,42,0.3)]"
          >
            <ActivityStatusIcon eventType={event.eventType} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-slate-950">{event.description}</p>
              <p className={`mt-0.5 text-[14px] font-bold tabular-nums ${impactClass(event.impactTone)}`}>{event.impact}</p>
            </div>
            <p className="shrink-0 text-[11px] font-medium text-slate-400">{event.timestamp}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiPlanCard({ plan, onNavigate }) {
  return (
    <section className="mt-4 pb-1" aria-label="Today's AI Plan">
      <SectionHead title="Today's AI Plan" actionLabel="Open" onAction={() => onNavigate('ai')} />
      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_6px_24px_-16px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef2ff] text-[#4f46e5]">
            <Bot className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-snug text-slate-950">{plan.summary}</p>
            <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Expected Additional Revenue</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums text-[#15803d]">{plan.expectedRevenueImpact}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Confidence</p>
                <p className="mt-1 text-[22px] font-bold tabular-nums text-[#2563eb]">{plan.confidenceScore}%</p>
              </div>
            </div>
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

      <EarningsHeroCard hero={hero} totalEarnings={totalEarnings} />
      <FleetStatusGrid strip={strip} onNavigate={onNavigate} />

      <div className="mt-4">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          onNavigate={onNavigate}
          activeCount={activeCount}
          totalCount={totalCount}
          mapHeightClass={MAP_HEIGHT}
        />
      </div>

      <FleetActivitySection events={activity} />
      <AiPlanCard plan={plan} onNavigate={onNavigate} />
    </div>
  );
}
