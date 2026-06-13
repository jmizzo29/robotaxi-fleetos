import {
  getFleetHealthSummary,
  getFleetOverviewMetrics,
  getFleetPreviewRows,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

function FleetOverviewHero({ overview }) {
  const { active, revenueDisplay, utilization, syncState, hasFleet } = overview;
  const activeLabel = hasFleet ? `${active} Active` : '—';
  const revenueLabel = revenueDisplay === '—' ? '—' : `${revenueDisplay} Today`;
  const utilizationLabel = utilization !== null ? `${utilization}% Utilization` : '—';

  return (
    <section className="pb-10 pt-2" aria-label="Fleet overview">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Overview</p>

      {syncState === 'loading' ? (
        <p className="mt-8 text-[15px] text-white/50">Connecting fleet…</p>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-[2.75rem] font-semibold leading-none tracking-tight text-white tabular-nums sm:text-5xl">
            {activeLabel}
          </p>
          <p className="text-[2.75rem] font-semibold leading-none tracking-tight text-white tabular-nums sm:text-5xl">
            {revenueLabel}
          </p>
          <p className="text-[2.75rem] font-semibold leading-none tracking-tight text-white tabular-nums sm:text-5xl">
            {utilizationLabel}
          </p>
        </div>
      )}
    </section>
  );
}

function RecommendedActionSection({ recommendation, onNavigate, onRetrySync }) {
  if (!recommendation) return null;

  const handleClick = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    if (recommendation.route) onNavigate(recommendation.route);
  };

  return (
    <section className="border-t border-white/10 py-8" aria-label="Recommended action">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Recommended Action</p>
      <button
        type="button"
        onClick={handleClick}
        className="mt-4 w-full text-left transition active:opacity-70"
      >
        <p className="text-[1.35rem] font-semibold leading-snug text-white sm:text-2xl">{recommendation.title}</p>
        {recommendation.subtitle && (
          <p className="mt-1 text-[14px] text-white/45">{recommendation.subtitle}</p>
        )}
      </button>
    </section>
  );
}

function FleetHealthSection({ health }) {
  return (
    <section className="border-t border-white/10 py-8" aria-label="Fleet health">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Health</p>
      <div className="mt-4 flex items-end gap-4">
        {health.score !== null && (
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-white sm:text-[3.25rem]">
            {health.score}
          </p>
        )}
        <p className={`pb-1 text-[1.25rem] font-medium sm:text-xl ${
          health.tone === 'caution' ? 'text-amber-300' : 'text-white'
        }`}
        >
          {health.label}
        </p>
      </div>
    </section>
  );
}

function SnapshotPill({ count, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-start py-1 transition active:opacity-70"
    >
      <span className="text-[24px] font-semibold tabular-nums leading-none text-white">{count}</span>
      <span className="mt-2 text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</span>
    </button>
  );
}

function FleetSnapshotSection({ counts, onNavigate }) {
  return (
    <section className="border-t border-white/10 py-8" aria-label="Fleet snapshot">
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Snapshot</p>
      <div className="flex gap-4">
        <SnapshotPill count={counts.online} label="Online" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.charging} label="Charging" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.offline} label="Offline" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.alerts} label="Alerts" onClick={() => onNavigate('alerts')} />
      </div>
    </section>
  );
}

function FleetPreviewSection({ rows, onNavigate }) {
  if (!rows.length) return null;

  return (
    <section className="border-t border-white/10 py-8" aria-label="Fleet preview">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Preview</p>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-4">
            <span className="truncate text-[17px] font-medium text-white">{row.name}</span>
            <span className="shrink-0 text-[14px] text-white/45">{row.status}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onNavigate('fleet')}
        className="mt-6 text-[15px] font-medium text-white transition active:opacity-70"
      >
        View Fleet →
      </button>
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
    <div className="bg-black px-5 pb-8">
      <FleetOverviewHero overview={overview} />
      <RecommendedActionSection
        recommendation={recommendation}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
      />
      <FleetHealthSection health={health} />
      <FleetSnapshotSection counts={snapshot} onNavigate={onNavigate} />
      <FleetPreviewSection rows={preview} onNavigate={onNavigate} />
    </div>
  );
}
