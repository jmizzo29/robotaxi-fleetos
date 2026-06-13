import { Bell, Bot, Car, User, Zap } from 'lucide-react';
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

const CYBERCAB_PREMIUM = '/vehicles/cybercab-premium.svg';

function SectionHead({ title, actionLabel, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
      {actionLabel && (
        <button type="button" onClick={onAction} className="text-[14px] font-semibold text-[#2563eb]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function CybercabRender({ className = 'h-10 w-[4.5rem]' }) {
  return (
    <div className={`overflow-hidden rounded-[14px] bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] ${className}`}>
      <img src={CYBERCAB_PREMIUM} alt="" className="h-full w-full object-contain p-0.5" draggable={false} />
    </div>
  );
}

function EarningsSparkline() {
  const points = '4,38 18,28 32,34 46,18 60,24 74,12 88,16 100,8';
  return (
    <svg viewBox="0 0 104 44" className="h-full w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="0" y="43" fill="rgba(255,255,255,0.65)" fontSize="6" fontWeight="600">12 AM</text>
      <text x="78" y="43" fill="rgba(255,255,255,0.65)" fontSize="6" fontWeight="600">12 AM</text>
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
        className="relative overflow-hidden rounded-[24px] border border-white/25 px-4 pb-4 pt-4 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.65)]"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 48%, #7c3aed 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-white">Net Earnings Today</p>
            <p className="mt-2 text-[3.75rem] font-bold leading-[0.95] tracking-[-0.04em] text-white">
              {hero.amount}
            </p>
            {hero.delta ? (
              <p className="mt-2 text-[13px] font-semibold text-[#bbf7d0]">▲ 18% vs yesterday</p>
            ) : (
              <p className="mt-2 text-[13px] font-semibold text-white/80">{hero.hint || 'Sync fleet to track earnings'}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
              Live
            </span>
            <div className="h-16 w-[7.75rem]">
              <EarningsSparkline />
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/25 pt-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
              <Car className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[30px] font-bold leading-none text-white">{hero.trips}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/80">Trips · +23 vs yesterday</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
              T
            </span>
            <div>
              <p className="text-[28px] font-bold leading-none text-white">{hero.teslaShare}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/80">Tesla Share · {sharePct || 30}% gross</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusMiniArt({ variant }) {
  if (variant === 'charging') {
    return (
      <div className="relative mx-auto mt-2 h-10 w-16">
        <CybercabRender className="absolute bottom-0 left-0 h-9 w-14" />
        <Zap className="absolute bottom-0 right-0 h-4 w-4 text-amber-500" strokeWidth={2.2} />
      </div>
    );
  }
  if (variant === 'offline') {
    return <CybercabRender className="mx-auto mt-2 h-10 w-16 opacity-35" />;
  }
  if (variant === 'total') {
    return (
      <div className="mx-auto mt-2 flex h-10 w-[4.5rem] items-end justify-center">
        <CybercabRender className="h-8 w-12 -mr-3 scale-90" />
        <CybercabRender className="h-9 w-14 z-10" />
        <CybercabRender className="h-8 w-12 -ml-3 scale-90" />
      </div>
    );
  }
  return <CybercabRender className="mx-auto mt-2 h-10 w-16" />;
}

function FleetStatusGrid({ strip, onNavigate }) {
  const total = strip.total || 0;
  const cards = [
    { key: 'active', label: 'Active', value: strip.active.value, bg: 'bg-[#ecfdf3]', border: 'border-[#bbf7d0]', text: 'text-[#15803d]', art: 'active' },
    { key: 'charging', label: 'Charging', value: strip.charging.value, bg: 'bg-[#fefce8]', border: 'border-[#fde68a]', text: 'text-[#a16207]', art: 'charging' },
    { key: 'offline', label: 'Offline', value: strip.offline.value, bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', text: 'text-[#dc2626]', art: 'offline' },
    { key: 'total', label: 'Total', value: String(total), bg: 'bg-[#eff6ff]', border: 'border-[#bfdbfe]', text: 'text-[#2563eb]', art: 'total' },
  ];

  return (
    <section className="mt-5" aria-label="Fleet status">
      <SectionHead title="Fleet Status" actionLabel="View all" onAction={() => onNavigate('fleet')} />
      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate(card.key === 'charging' ? 'charging' : 'fleet')}
            className={`rounded-[18px] border px-1.5 pb-2.5 pt-3 text-center shadow-sm ${card.bg} ${card.border}`}
          >
            <p className={`text-[32px] font-bold leading-none ${card.text}`}>{card.value}</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{card.label}</p>
            <StatusMiniArt variant={card.art} />
          </button>
        ))}
      </div>
    </section>
  );
}

function impactClass(tone) {
  if (tone === 'positive') return 'text-[#15803d]';
  if (tone === 'surge') return 'text-[#2563eb]';
  return 'text-slate-500';
}

function FleetActivitySection({ events }) {
  return (
    <section className="mt-5" aria-label="Fleet activity">
      <SectionHead title="Fleet Activity" />
      <ul className="space-y-2.5">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)]"
          >
            <CybercabRender className="h-[3.4rem] w-[5.5rem] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-slate-900">{event.description}</p>
              <p className={`mt-1 text-[14px] font-bold ${impactClass(event.impactTone)}`}>{event.impact}</p>
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
    <section className="mt-5 pb-2" aria-label="Today's AI Plan">
      <SectionHead title="Today's AI Plan" actionLabel="Open" onAction={() => onNavigate('ai')} />
      <div className="rounded-[20px] border border-[#c7d2fe] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(79,70,229,0.25)]">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eef2ff] text-[#4f46e5]">
            <Bot className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-snug text-slate-900">{plan.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-[13px] font-bold text-[#15803d]">
                {plan.expectedRevenueImpact}
              </span>
              <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[13px] font-bold text-[#2563eb]">
                {plan.confidenceScore}% confidence
              </span>
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
    <div className="min-h-screen bg-[#f3f4f8] px-4 pb-28 pt-3 text-slate-900">
      <header className="mb-5 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1.1rem] tracking-[0.04em]" colorClass="text-[#1e3a8a]" />
        <div className="flex items-center gap-2.5">
          <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px] text-slate-700" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white">
              2
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 shadow-sm"
            aria-label="Account"
          >
            <User className="h-5 w-5 text-slate-600" strokeWidth={2} />
          </button>
        </div>
      </header>

      <EarningsHeroCard hero={hero} totalEarnings={totalEarnings} />
      <FleetStatusGrid strip={strip} onNavigate={onNavigate} />

      <div className="mt-5">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          onNavigate={onNavigate}
          activeCount={activeCount}
          totalCount={totalCount}
          variant="mockup"
        />
      </div>

      <FleetActivitySection events={activity} />
      <AiPlanCard plan={plan} onNavigate={onNavigate} />
    </div>
  );
}
