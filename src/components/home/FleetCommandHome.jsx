import { ChevronRight, Sparkles } from 'lucide-react';
import {
  getFleetHealthSummary,
  getFleetOverviewMetrics,
  getFleetPreviewRows,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

function HeroMetric({ value, label, variant = 'secondary' }) {
  const isPrimary = variant === 'primary';

  return (
    <div className={`min-w-0 text-center ${isPrimary ? 'px-2' : 'px-1 first:pl-0 last:pr-0'}`}>
      <p
        className={`truncate tabular-nums leading-none tracking-tight ${
          isPrimary
            ? 'text-[2.85rem] font-semibold text-emerald-300 sm:text-[3rem]'
            : 'text-[1.35rem] font-medium text-white/80'
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-2 font-medium uppercase tracking-[0.14em] ${
          isPrimary
            ? 'text-[10px] text-emerald-400/70'
            : 'text-[9px] text-white/35'
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function FleetOverviewHeroCard({ overview, health }) {
  const { active, revenueDisplay, utilization, syncState, hasFleet } = overview;
  const activeValue = hasFleet ? String(active) : '—';
  const revenueValue = revenueDisplay === '—' ? '—' : revenueDisplay;
  const utilizationValue = utilization !== null ? `${utilization}%` : '—';
  const healthIsCaution = health.tone === 'caution';

  return (
    <section
      className="relative overflow-hidden rounded-[1.35rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.14] via-white/[0.04] to-[#0a0a0a] p-5 shadow-[0_28px_70px_-32px_rgba(16,185,129,0.35)]"
      aria-label="Fleet overview"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/75">Fleet Overview</p>
      </div>

      {syncState === 'loading' ? (
        <p className="relative mt-10 pb-4 text-center text-[15px] text-white/45">Connecting fleet…</p>
      ) : (
        <>
          <div className="relative mt-6 grid grid-cols-3 divide-x divide-white/10">
            <HeroMetric value={activeValue} label="Active Vehicles" variant="primary" />
            <HeroMetric value={revenueValue} label="Revenue Today" />
            <HeroMetric value={utilizationValue} label="Utilization" />
          </div>
          <p
            className={`relative mt-5 flex items-center justify-center gap-2 border-t border-emerald-500/10 pt-4 text-center text-[11px] font-medium ${
              healthIsCaution ? 'text-amber-300/85' : 'text-emerald-300/65'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                healthIsCaution ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`}
              aria-hidden="true"
            />
            {health.score !== null ? `${health.score} · ` : ''}{health.label}
          </p>
        </>
      )}
    </section>
  );
}

function RecommendationCard({ recommendation, onNavigate, onRetrySync }) {
  if (!recommendation) return null;

  const handleClick = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    if (recommendation.route) onNavigate(recommendation.route);
  };

  return (
    <section className="mt-4" aria-label="Recommended action">
      <button
        type="button"
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-[1.15rem] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.1] to-white/[0.04] px-5 py-4 text-left transition active:from-emerald-500/[0.14]"
      >
        <span
          className="absolute inset-y-0 left-0 w-1 bg-emerald-400/80"
          aria-hidden="true"
        />
        <div className="flex items-start gap-3.5 pl-1">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
            <Sparkles className="h-4 w-4 text-emerald-300" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Recommended Action</p>
            <p className="mt-2 text-[1.125rem] font-semibold leading-snug text-white">{recommendation.title}</p>
            {recommendation.subtitle && (
              <p className="mt-1 text-[13px] text-white/50">{recommendation.subtitle}</p>
            )}
          </div>
          <ChevronRight
            className="mt-2 h-5 w-5 shrink-0 text-emerald-400/45 transition group-active:text-emerald-300/70"
            strokeWidth={2}
          />
        </div>
      </button>
    </section>
  );
}

function SnapshotChip({ count, label, onClick, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border px-1 py-2.5 transition active:bg-white/[0.06] ${
        accent
          ? 'border-emerald-500/25 bg-emerald-500/[0.08]'
          : 'border-white/[0.06] bg-white/[0.03]'
      }`}
    >
      <span className={`text-[18px] font-semibold tabular-nums leading-none ${accent ? 'text-emerald-300' : 'text-white'}`}>
        {count}
      </span>
      <span className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-[0.08em] text-white/35">{label}</span>
    </button>
  );
}

function FleetSnapshotRow({ counts, onNavigate }) {
  return (
    <section className="mt-4" aria-label="Fleet snapshot">
      <div className="flex gap-2">
        <SnapshotChip count={counts.online} label="Online" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.charging} label="Charging" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.offline} label="Offline" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.alerts} label="Alerts" onClick={() => onNavigate('alerts')} accent={counts.alerts > 0} />
      </div>
    </section>
  );
}

function previewStatusClass(status) {
  if (status === 'Online' || status === 'Parked') return 'text-emerald-400/70';
  return 'text-white/40';
}

function FleetPreviewSection({ rows, onNavigate }) {
  if (!rows.length) return null;

  return (
    <section className="mt-6" aria-label="Fleet preview">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Preview</p>
        <button
          type="button"
          onClick={() => onNavigate('fleet')}
          className="inline-flex items-center gap-0.5 text-[13px] font-medium text-emerald-400/60 transition active:text-emerald-300"
        >
          View Fleet
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/[0.02]">
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onNavigate('fleet')}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition active:bg-white/[0.04]"
              >
                <span className="truncate text-[15px] font-medium text-white">{row.name}</span>
                <span className={`shrink-0 text-[12px] font-medium ${previewStatusClass(row.status)}`}>
                  {row.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function FleetCommandHome({
  fleet = [],
  realFleet = [],
  totalEarnings = 0,
  realSyncStatus = null,
  isLoadingReal = false,
  onRetrySync = () => {},
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const snapshotSource = realFleet.length > 0 ? realFleet : fleet;
  const overview = getFleetOverviewMetrics(fleet, realFleet, totalEarnings, syncState);
  const recommendation = getFleetRecommendation(snapshotSource, realSyncStatus);
  const snapshot = getFleetSnapshotCounts(snapshotSource);
  const health = getFleetHealthSummary(fleet, realFleet, snapshot);
  const preview = getFleetPreviewRows(fleet, realFleet, 3);

  return (
    <div className="bg-[#0a0a0a] px-4 pb-8 pt-3">
      <FleetOverviewHeroCard overview={overview} health={health} />
      <RecommendationCard
        recommendation={recommendation}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
      />
      <FleetSnapshotRow counts={snapshot} onNavigate={onNavigate} />
      <FleetPreviewSection rows={preview} onNavigate={onNavigate} />
    </div>
  );
}
