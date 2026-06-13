import { AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import FleetVehicleThumbnail from './FleetVehicleThumbnail';
import {
  getFleetAvailabilitySummary,
  getFleetEarningsSummary,
  getFleetHealthSummary,
  getFleetPreviewRows,
  getFleetRecommendation,
  getFleetSnapshotCounts,
} from '../../utils/vehicleDisplayUtils';

const toneStyles = {
  ready: {
    rail: 'bg-emerald-400/80',
    border: 'border-emerald-500/25',
    bg: 'from-emerald-500/[0.12] to-white/[0.04]',
    iconWrap: 'bg-emerald-500/15 ring-emerald-400/25',
    icon: 'text-emerald-300',
    label: 'text-emerald-400/80',
    chevron: 'text-emerald-400/50 group-active:text-emerald-300/70',
  },
  action: {
    rail: 'bg-white/30',
    border: 'border-white/12',
    bg: 'from-white/[0.06] to-white/[0.03]',
    iconWrap: 'bg-white/10 ring-white/15',
    icon: 'text-white/80',
    label: 'text-white/45',
    chevron: 'text-white/35 group-active:text-white/60',
  },
  warning: {
    rail: 'bg-amber-400/85',
    border: 'border-amber-500/25',
    bg: 'from-amber-500/[0.12] to-white/[0.03]',
    iconWrap: 'bg-amber-500/15 ring-amber-400/25',
    icon: 'text-amber-300',
    label: 'text-amber-400/80',
    chevron: 'text-amber-400/50 group-active:text-amber-300/70',
  },
  issue: {
    rail: 'bg-red-400/85',
    border: 'border-red-500/25',
    bg: 'from-red-500/[0.12] to-white/[0.03]',
    iconWrap: 'bg-red-500/15 ring-red-400/25',
    icon: 'text-red-300',
    label: 'text-red-400/80',
    chevron: 'text-red-400/50 group-active:text-red-300/70',
  },
};

function statusDotClass(tone) {
  if (tone === 'ready') return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]';
  if (tone === 'warning') return 'bg-amber-400';
  if (tone === 'issue') return 'bg-red-400';
  return 'bg-white/35';
}

function statusTextClass(tone) {
  if (tone === 'ready') return 'text-emerald-400/80';
  if (tone === 'warning') return 'text-amber-300/85';
  if (tone === 'issue') return 'text-red-300/85';
  return 'text-white/45';
}

function FleetEarningsCard({ earnings, syncState }) {
  const isLoading = syncState === 'loading';
  const isPositive = earnings.tone === 'positive';

  return (
    <section
      className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-gradient-to-br from-white/[0.06] to-[#0a0a0a] p-5 shadow-[0_28px_70px_-32px_rgba(0,0,0,0.9)]"
      aria-label="How much is my fleet earning?"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
        Fleet Earnings
      </p>

      {isLoading ? (
        <p className="relative mt-10 pb-2 text-center text-[15px] text-white/45">Connecting fleet…</p>
      ) : (
        <div className="relative mt-6 text-center">
          <p
            className={`text-[3.35rem] font-semibold tabular-nums leading-none tracking-tight sm:text-[3.6rem] ${
              isPositive ? 'text-white' : 'text-white/90'
            }`}
          >
            {earnings.amount}
          </p>
          <p className="mt-3 text-[13px] font-medium uppercase tracking-[0.12em] text-white/40">
            {earnings.context}
          </p>
          {earnings.delta && (
            <p className="mt-2 text-[14px] font-medium text-emerald-400/90">{earnings.delta}</p>
          )}
        </div>
      )}
    </section>
  );
}

function TakeActionCard({ recommendation, onNavigate, onRetrySync }) {
  if (!recommendation) return null;

  const tone = recommendation.tone || 'action';
  const styles = toneStyles[tone] || toneStyles.action;
  const Icon = tone === 'ready' ? CheckCircle2 : tone === 'warning' || tone === 'issue' ? AlertTriangle : Sparkles;

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
        className={`group relative w-full overflow-hidden rounded-[1.15rem] border bg-gradient-to-r px-5 py-4 text-left transition active:brightness-110 ${styles.border} ${styles.bg}`}
      >
        <span className={`absolute inset-y-0 left-0 w-1 ${styles.rail}`} aria-hidden="true" />
        <div className="flex items-start gap-3.5 pl-1">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${styles.iconWrap}`}>
            <Icon className={`h-4 w-4 ${styles.icon}`} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}>Take Action Now</p>
            <p className="mt-2 text-[1.125rem] font-semibold leading-snug text-white">{recommendation.title}</p>
            {recommendation.subtitle && (
              <p className="mt-1 text-[13px] text-white/50">{recommendation.subtitle}</p>
            )}
          </div>
          <ChevronRight className={`mt-2 h-5 w-5 shrink-0 transition ${styles.chevron}`} strokeWidth={2} />
        </div>
      </button>
    </section>
  );
}

function SnapshotChip({ count, label, onClick, tone = 'neutral' }) {
  const countClass = tone === 'warning'
    ? 'text-amber-300'
    : tone === 'issue'
      ? 'text-red-300'
      : 'text-white';
  const borderClass = tone === 'warning'
    ? 'border-amber-500/25 bg-amber-500/[0.08]'
    : tone === 'issue'
      ? 'border-red-500/25 bg-red-500/[0.08]'
      : 'border-white/[0.06] bg-white/[0.03]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border px-1 py-2.5 transition active:bg-white/[0.06] ${borderClass}`}
    >
      <span className={`text-[18px] font-semibold tabular-nums leading-none ${countClass}`}>{count}</span>
      <span className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-[0.08em] text-white/40">{label}</span>
    </button>
  );
}

function batteryBarClass(tone) {
  if (tone === 'warning') return 'bg-amber-400';
  if (tone === 'issue') return 'bg-red-400';
  if (tone === 'ready') return 'bg-emerald-400';
  return 'bg-white/50';
}

function FleetPreviewRow({ row, onNavigate }) {
  const batteryWidth = row.battery !== null ? Math.max(8, Math.min(100, row.battery)) : 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavigate('fleet')}
        className="flex w-full items-center gap-3.5 rounded-xl py-3.5 text-left transition active:bg-white/[0.04]"
      >
        <FleetVehicleThumbnail
          vehicle={row.vehicle}
          ownership={row.ownership}
          tone={row.tone}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-semibold leading-tight text-white">{row.name}</p>
            {row.battery !== null && (
              <p className="shrink-0 text-[14px] font-semibold tabular-nums text-white/80">{row.battery}%</p>
            )}
          </div>

          {(row.subtitle || row.meta) && (
            <p className="mt-0.5 truncate text-[12px] text-white/45">
              {[row.subtitle, row.meta].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(row.tone)}`} aria-hidden="true" />
            <span className={`text-[12px] font-medium ${statusTextClass(row.tone)}`}>{row.status}</span>
            {row.lastUpdate && (
              <>
                <span className="text-white/20">·</span>
                <span className="truncate text-[11px] text-white/35">{row.lastUpdate}</span>
              </>
            )}
          </div>

          {row.battery !== null && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${batteryBarClass(row.tone)}`}
                style={{ width: `${batteryWidth}%` }}
              />
            </div>
          )}
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-white/25" strokeWidth={2} />
      </button>
    </li>
  );
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
            healthIsCaution ? 'text-amber-300/85' : 'text-emerald-400/75'
          }`}
        >
          {health.score !== null ? `${health.score} · ` : ''}{health.label}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <SnapshotChip count={counts.online} label="Online" onClick={() => onNavigate('fleet')} />
        <SnapshotChip count={counts.charging} label="Charging" onClick={() => onNavigate('fleet')} />
        <SnapshotChip
          count={counts.offline}
          label="Offline"
          onClick={() => onNavigate('fleet')}
          tone={counts.offline > 0 ? 'issue' : 'neutral'}
        />
        <SnapshotChip
          count={counts.alerts}
          label="Alerts"
          onClick={() => onNavigate('alerts')}
          tone={counts.alerts > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {rows.length > 0 && (
        <>
          <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-1">
            {rows.map((row) => (
              <FleetPreviewRow key={row.id} row={row} onNavigate={onNavigate} />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('fleet')}
            className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-medium text-white/55 transition active:text-white"
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
  const preview = getFleetPreviewRows(
    fleet,
    realFleet,
    3,
    realSyncStatus?.lastSyncedAt,
  );

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
