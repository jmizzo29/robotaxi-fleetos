import { ChevronRight, Sparkles } from 'lucide-react';
import {
  getFleetAvailabilitySummary,
  getFleetEarningsSummary,
  getFleetHealthSummary,
  getFleetPreviewRows,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

function FleetEarningsCard({ earnings, syncState }) {
  const healthIsLoading = syncState === 'loading';

  return (
    <section
      className="relative overflow-hidden rounded-[1.35rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.14] via-white/[0.04] to-[#0a0a0a] p-5 shadow-[0_28px_70px_-32px_rgba(16,185,129,0.35)]"
      aria-label="How much is my fleet earning?"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
        aria-hidden="true"
      />

      <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/75">
        Fleet Earnings
      </p>

      {healthIsLoading ? (
        <p className="relative mt-10 pb-2 text-center text-[15px] text-white/45">Connecting fleet…</p>
      ) : (
        <div className="relative mt-6 text-center">
          <p className="text-[3.25rem] font-semibold tabular-nums leading-none tracking-tight text-emerald-300 sm:text-[3.5rem]">
            {earnings.amount}
          </p>
          <p className="mt-4 text-[14px] font-medium text-white/55">{earnings.context}</p>
        </div>
      )}
    </section>
  );
}

function TakeActionCard({ recommendation, onNavigate, onRetrySync }) {
  if (!recommendation) return null;

  const handleClick = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    if (recommendation.route) onNavigate(recommendation.route);
  };

  return (
    <section className="mt-4" aria-label="What action should I take right now?">
      <button
        type="button"
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-[1.15rem] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.1] to-white/[0.04] px-5 py-4 text-left transition active:from-emerald-500/[0.14]"
      >
        <span className="absolute inset-y-0 left-0 w-1 bg-emerald-400/80" aria-hidden="true" />
        <div className="flex items-start gap-3.5 pl-1">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
            <Sparkles className="h-4 w-4 text-emerald-300" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">Take Action Now</p>
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

function previewStatusClass(status) {
  if (status === 'Online' || status === 'Parked') return 'text-emerald-400/70';
  return 'text-white/40';
}

function FleetAvailabilitySection({ availability, counts, rows, onNavigate }) {
  const { summary, health } = availability;
  const healthIsCaution = health.tone === 'caution';

  return (
    <section
      className="mt-4 overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/[0.02] p-4"
      aria-label="Are my vehicles available and healthy?"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Availability & Health</p>
          <p className="mt-2 text-[15px] font-medium leading-snug text-white">{summary}</p>
        </div>
        <p
          className={`shrink-0 text-right text-[11px] font-medium ${
            healthIsCaution ? 'text-amber-300/85' : 'text-emerald-300/70'
          }`}
        >
          {health.score !== null ? `${health.score} · ` : ''}{health.label}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <SnapshotChip count={counts.online} label="Online" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.charging} label="Charging" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.offline} label="Offline" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.alerts} label="Alerts" onClick={() => onNavigate('alerts')} accent={counts.alerts > 0} />
      </div>

      {rows.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('fleet')}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left transition active:opacity-70"
                >
                  <span className="truncate text-[14px] font-medium text-white">{row.name}</span>
                  <span className={`shrink-0 text-[12px] font-medium ${previewStatusClass(row.status)}`}>
                    {row.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('fleet')}
            className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-medium text-emerald-400/60 transition active:text-emerald-300"
          >
            View Fleet
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      )}
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
  const earnings = getFleetEarningsSummary(realFleet, totalEarnings, syncState);
  const recommendation = getFleetRecommendation(snapshotSource, realSyncStatus);
  const snapshot = getFleetSnapshotCounts(snapshotSource);
  const health = getFleetHealthSummary(fleet, realFleet, snapshot);
  const availability = getFleetAvailabilitySummary(fleet, realFleet, snapshot, health);
  const preview = getFleetPreviewRows(fleet, realFleet, 3);

  return (
    <div className="bg-[#0a0a0a] px-4 pb-8 pt-3">
      <FleetEarningsCard earnings={earnings} syncState={syncState} />
      <TakeActionCard
        recommendation={recommendation}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
      />
      <FleetAvailabilitySection
        availability={availability}
        counts={snapshot}
        rows={preview}
        onNavigate={onNavigate}
      />
    </div>
  );
}
