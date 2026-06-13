import { Bell, Car, Check, User, Zap } from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import { getFleetVisibilityRows } from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
  getFleetRecommendation,
  lastSyncedLabel,
  vehicleBatteryPercent,
} from '../../utils/vehicleDisplayUtils';

const CYBERCAB_LIGHT = '/vehicles/cybercab-light.svg';

function SectionHead({ title, actionLabel, onAction }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
      {actionLabel && (
        <button type="button" onClick={onAction} className="text-[11px] font-semibold text-[#2563eb]">
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
      <polyline
        points={points}
        fill="none"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="0" y="43" fill="rgba(255,255,255,0.55)" fontSize="6" fontWeight="600">12 AM</text>
      <text x="78" y="43" fill="rgba(255,255,255,0.55)" fontSize="6" fontWeight="600">12 AM</text>
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
        className="relative overflow-hidden rounded-[22px] px-4 pb-3.5 pt-4 shadow-[0_16px_40px_-18px_rgba(59,130,246,0.55)]"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 52%, #7c3aed 100%)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-white/85">Net Earnings Today</p>
            <p className="mt-1.5 text-[42px] font-bold leading-none tracking-[-0.04em] text-white">
              {hero.amount}
            </p>
            {hero.delta ? (
              <p className="mt-1.5 text-[12px] font-semibold text-[#bbf7d0]">
                ▲ 18% vs yesterday
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] font-semibold text-white/70">{hero.hint || 'Sync fleet to track earnings'}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              Live
            </span>
            <div className="h-14 w-[7.5rem]">
              <EarningsSparkline />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/20 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
              <Car className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[14px] font-bold text-white">{hero.trips} Trips</p>
              <p className="text-[10px] font-medium text-white/70">+23 vs yesterday</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white">
              T
            </span>
            <div>
              <p className="text-[14px] font-bold text-white">{hero.teslaShare} Tesla Share</p>
              <p className="text-[10px] font-medium text-white/70">{sharePct || 30}% of gross</p>
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
      <div className="relative mx-auto mt-2 h-8 w-14">
        <img src={CYBERCAB_LIGHT} alt="" className="absolute bottom-0 left-0 h-7 w-12 object-contain" />
        <Zap className="absolute bottom-0 right-0 h-4 w-4 text-amber-500" strokeWidth={2.2} />
      </div>
    );
  }
  if (variant === 'offline') {
    return <img src={CYBERCAB_LIGHT} alt="" className="mx-auto mt-2 h-8 w-14 object-contain opacity-35" />;
  }
  if (variant === 'total') {
    return (
      <div className="mx-auto mt-2 flex h-8 w-16 items-end justify-center gap-0.5">
        <img src={CYBERCAB_LIGHT} alt="" className="h-6 w-9 object-contain" />
        <img src={CYBERCAB_LIGHT} alt="" className="h-7 w-10 object-contain -ml-2" />
        <img src={CYBERCAB_LIGHT} alt="" className="h-6 w-9 object-contain -ml-2" />
      </div>
    );
  }
  return <img src={CYBERCAB_LIGHT} alt="" className="mx-auto mt-2 h-8 w-14 object-contain" />;
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
    <section className="mt-4" aria-label="Fleet status">
      <SectionHead title="Fleet Status" actionLabel="View all" onAction={() => onNavigate('fleet')} />
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate(card.key === 'charging' ? 'charging' : 'fleet')}
            className={`rounded-[16px] border px-1.5 pb-2 pt-2.5 text-center shadow-sm ${card.bg} ${card.border}`}
          >
            <p className={`text-[22px] font-bold leading-none ${card.text}`}>{card.value}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">{card.label}</p>
            <StatusMiniArt variant={card.art} />
          </button>
        ))}
      </div>
    </section>
  );
}

function previewStatusPill(status, tone) {
  const styles = {
    ready: 'bg-[#dcfce7] text-[#15803d]',
    warning: 'bg-[#fef9c3] text-[#a16207]',
    issue: 'bg-[#fee2e2] text-[#dc2626]',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return styles[tone] || styles.neutral;
}

function FleetPreviewCarousel({ rows, onNavigate }) {
  if (!rows.length) return null;

  return (
    <section className="mt-4" aria-label="Fleet preview">
      <SectionHead title="Fleet Preview" actionLabel="View all" onAction={() => onNavigate('fleet')} />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
        {rows.map((row) => {
          const battery = vehicleBatteryPercent(row.vehicle);
          const updated = lastSyncedLabel(row.vehicle?.syncedAt || row.vehicle?.lastSyncedAt, 'Updated');

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onNavigate('fleet')}
              className="w-[148px] shrink-0 rounded-[18px] border border-slate-200 bg-white p-2.5 text-left shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)]"
            >
              <div className="overflow-hidden rounded-[14px] bg-[#f8fafc] px-1 pt-1">
                <img src={CYBERCAB_LIGHT} alt="" className="mx-auto h-[4.5rem] w-full object-contain" />
              </div>
              <div className="mt-2 flex items-start justify-between gap-1">
                <p className="truncate text-[12px] font-bold text-slate-900">{row.name}</p>
                {battery !== null && (
                  <span className="shrink-0 text-[11px] font-bold text-slate-700">{battery}%</span>
                )}
              </div>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${previewStatusPill(row.status, row.tone)}`}>
                {row.status}
              </span>
              <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
                {row.vehicle?.city?.split(',')[0] || 'Orlando area'}
              </p>
              <p className="truncate text-[10px] text-slate-400">{row.line}</p>
              {updated && <p className="mt-0.5 text-[9px] text-slate-400">{updated}</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FleetReadyBanner({ recommendation }) {
  const isReady = recommendation.tone === 'ready';

  return (
    <section className="mt-4 pb-2" aria-label="Recommended action">
      <div
        className="relative overflow-hidden rounded-[20px] px-4 py-4 shadow-[0_10px_30px_-16px_rgba(34,197,94,0.55)]"
        style={{
          background: isReady
            ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 55%, #16a34a 100%)'
            : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 55%, #d97706 100%)',
        }}
      >
        <svg className="pointer-events-none absolute bottom-0 right-0 h-20 w-32 opacity-25" viewBox="0 0 120 60" aria-hidden="true">
          <circle cx="98" cy="14" r="10" fill="#fef9c3" />
          <path d="M0 60 L20 42 L34 48 L52 34 L68 44 L86 30 L104 38 L120 28 L120 60 Z" fill="#15803d" opacity="0.55" />
        </svg>
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[16px] font-bold text-white">{isReady ? 'Fleet Ready' : recommendation.title}</p>
            <p className="mt-0.5 text-[12px] font-medium text-white/85">
              {isReady ? 'No action needed right now' : recommendation.subtitle}
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
  onNavigate = () => {},
}) {
  void realSyncStatus;
  void isLoadingReal;

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const hero = getCommandEarningsHero(realFleet, totalEarnings, syncState);
  const strip = getCommandFleetStatusStrip(fleet, realFleet);
  const previewRows = getFleetVisibilityRows(fleet, realFleet, 6);
  const recommendation = getFleetRecommendation(realFleet, realSyncStatus);
  const activeCount = Number(strip.active.value) || 0;
  const totalCount = strip.total || fleet.length;

  return (
    <div className="min-h-screen bg-[#f3f4f8] px-4 pb-28 pt-3 text-slate-900">
      <header className="mb-4 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1.05rem] tracking-[0.04em]" colorClass="text-[#1e3a8a]" />
        <div className="flex items-center gap-2.5">
          <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px] text-slate-700" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white">
              2
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm"
            aria-label="Account"
          >
            <User className="h-5 w-5 text-slate-600" strokeWidth={2} />
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
          variant="mockup"
        />
      </div>

      <FleetPreviewCarousel rows={previewRows} onNavigate={onNavigate} />
      <FleetReadyBanner recommendation={recommendation} />
    </div>
  );
}
