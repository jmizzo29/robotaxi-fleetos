import { ChevronRight } from 'lucide-react';
import {
  getFleetHealthSummary,
  getFleetOverviewMetrics,
  getFleetPreviewRows,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

function HeroMetric({ value, label, emphasize = false }) {
  return (
    <div className="min-w-0 px-1 text-center first:pl-0 last:pr-0">
      <p
        className={`truncate font-semibold tabular-nums leading-none tracking-tight text-white ${
          emphasize ? 'text-[2rem]' : 'text-[1.65rem]'
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">{label}</p>
    </div>
  );
}

function FleetOverviewHeroCard({ overview, health }) {
  const { active, revenueDisplay, utilization, syncState, hasFleet } = overview;
  const activeValue = hasFleet ? String(active) : '—';
  const revenueValue = revenueDisplay === '—' ? '—' : revenueDisplay;
  const utilizationValue = utilization !== null ? `${utilization}%` : '—';

  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]"
      aria-label="Fleet overview"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Overview</p>
      </div>

      {syncState === 'loading' ? (
        <p className="mt-10 pb-4 text-center text-[15px] text-white/45">Connecting fleet…</p>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-3 divide-x divide-white/10">
            <HeroMetric value={activeValue} label="Active" emphasize />
            <HeroMetric value={revenueValue} label="Today" />
            <HeroMetric value={utilizationValue} label="Utilization" />
          </div>
          <p className={`mt-5 border-t border-white/[0.06] pt-4 text-center text-[11px] font-medium ${
            health.tone === 'caution' ? 'text-amber-300/80' : 'text-white/35'
          }`}
          >
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
        className="w-full rounded-[1.15rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-left transition active:bg-white/[0.08]"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Recommended Action</p>
        <p className="mt-2.5 text-[1.125rem] font-semibold leading-snug text-white">{recommendation.title}</p>
        {recommendation.subtitle && (
          <p className="mt-1 text-[13px] text-white/45">{recommendation.subtitle}</p>
        )}
      </button>
    </section>
  );
}

function SnapshotChip({ count, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-1 py-2.5 transition active:bg-white/[0.06]"
    >
      <span className="text-[18px] font-semibold tabular-nums leading-none text-white">{count}</span>
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
        <SnapshotChip count={counts.alerts} label="Alerts" onClick={() => onNavigate('alerts')} />
      </div>
    </section>
  );
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
          className="inline-flex items-center gap-0.5 text-[13px] font-medium text-white/55 transition active:text-white"
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
                <span className="shrink-0 text-[12px] font-medium text-white/40">{row.status}</span>
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
