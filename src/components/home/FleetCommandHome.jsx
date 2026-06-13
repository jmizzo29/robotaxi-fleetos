import {
  getFleetHeroMetric,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

function FleetStatusHero({ hero }) {
  return (
    <section className="pt-2 pb-10 text-center" aria-label="Fleet status">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">Fleet</p>
      <p className="mt-4 text-[64px] font-light tabular-nums leading-none tracking-tight text-white">
        {hero.value}
      </p>
      <p className="mt-3 text-[13px] text-white/40">{hero.label}</p>
      {hero.sub && (
        <p className="mt-1 text-[13px] text-white/30">{hero.sub}</p>
      )}
    </section>
  );
}

function RecommendationSection({ recommendation, onNavigate, onRetrySync }) {
  if (!recommendation) return null;

  const handleClick = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    if (recommendation.route) onNavigate(recommendation.route);
  };

  return (
    <section className="mb-8" aria-label="Recommendation">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left backdrop-blur-md transition active:bg-white/10"
      >
        <p className="text-[17px] font-medium text-white">{recommendation.title}</p>
        <p className="mt-0.5 text-[14px] text-white/50">{recommendation.subtitle}</p>
      </button>
    </section>
  );
}

function SnapshotPill({ count, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center rounded-2xl bg-white/[0.04] px-2 py-4 transition active:bg-white/[0.08]"
    >
      <span className="text-[28px] font-semibold tabular-nums leading-none text-white">{count}</span>
      <span className="mt-2 text-[11px] font-medium uppercase tracking-wide text-white/35">{label}</span>
    </button>
  );
}

function FleetSnapshotSection({ counts, onNavigate }) {
  return (
    <section aria-label="Fleet snapshot">
      <div className="flex gap-2">
        <SnapshotPill count={counts.online} label="Online" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.charging} label="Charging" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.offline} label="Offline" onClick={() => onNavigate('fleet')} />
        <SnapshotPill count={counts.alerts} label="Alerts" onClick={() => onNavigate('alerts')} />
      </div>
    </section>
  );
}

export default function FleetCommandHome({
  realFleet = [],
  totalEarnings = 0,
  realSyncStatus = null,
  isLoadingReal = false,
  onRetrySync = () => {},
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const hero = getFleetHeroMetric({ realFleet, totalEarnings, syncState });
  const recommendation = getFleetRecommendation(realFleet, realSyncStatus);
  const snapshot = getFleetSnapshotCounts(realFleet);

  return (
    <div className="bg-black px-5 pt-4 pb-8">
      <FleetStatusHero hero={hero} />
      <RecommendationSection
        recommendation={recommendation}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
      />
      <FleetSnapshotSection counts={snapshot} onNavigate={onNavigate} />
    </div>
  );
}
