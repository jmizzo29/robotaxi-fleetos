import { ArrowRight, ChevronRight } from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import FleetVehicleThumbnail from './FleetVehicleThumbnail';
import { getFleetVisibilityRows } from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
  getFleetRecommendation,
  vehicleBatteryPercent,
} from '../../utils/vehicleDisplayUtils';

const stripToneClasses = {
  ready: 'text-white',
  connected: 'text-[#599CE7]',
  caution: 'text-amber-300',
  neutral: 'text-white/70',
};

const statusLabelClasses = {
  ready: 'text-emerald-400',
  warning: 'text-[#599CE7]',
  issue: 'text-amber-300',
  neutral: 'text-white/60',
};

const actionToneClasses = {
  ready: {
    border: 'border-emerald-500/25',
    rail: 'border-l-emerald-400',
  },
  warning: {
    border: 'border-amber-500/25',
    rail: 'border-l-amber-400',
    button: 'bg-[#599CE7] text-[#0a1020]',
  },
  issue: {
    border: 'border-rose-500/25',
    rail: 'border-l-rose-400',
    button: 'bg-[#599CE7] text-[#0a1020]',
  },
  action: {
    border: 'border-[#599CE7]/25',
    rail: 'border-l-[#599CE7]',
    button: 'bg-[#599CE7] text-[#0a1020]',
  },
};

function SectionEyebrow({ children }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{children}</p>
  );
}

function EarningsHero({ hero }) {
  return (
    <section aria-label="Net earnings today">
      <div className="rounded-[1.1rem] border border-[#599CE7]/40 bg-[#599CE7]/[0.04] px-4 py-3.5">
        <p className="text-[2.75rem] font-semibold tabular-nums leading-none tracking-[-0.04em] text-white">
          {hero.amount}
        </p>
        <p className="mt-1 text-[12px] font-semibold text-white/65">{hero.label}</p>
        {hero.delta && (
          <p className="mt-1.5 text-[11px] font-medium text-emerald-400">{hero.delta}</p>
        )}
        {hero.hint && (
          <p className="mt-1.5 text-[11px] text-white/45">{hero.hint}</p>
        )}
      </div>
    </section>
  );
}

function TripsShareRow({ hero }) {
  return (
    <section className="mt-2" aria-label="Trips and Tesla share">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[1.35rem] font-semibold tabular-nums leading-none text-white">{hero.trips}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">Trips</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[1.35rem] font-semibold tabular-nums leading-none text-white">{hero.teslaShare}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">Tesla Share</p>
        </div>
      </div>
    </section>
  );
}

function FleetStatusStrip({ strip, onNavigate }) {
  const cells = [
    { key: 'active', label: 'Active' },
    { key: 'charging', label: 'Charging' },
    { key: 'offline', label: 'Offline' },
  ];

  return (
    <section className="mt-2.5" aria-label="Fleet status">
      <SectionEyebrow>Fleet status</SectionEyebrow>
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map(({ key, label }) => {
          const cell = strip[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key === 'charging' ? 'charging' : 'fleet')}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-1.5 py-2 text-center transition active:brightness-110"
            >
              <p className={`text-[1.2rem] font-semibold tabular-nums leading-none ${stripToneClasses[cell.tone]}`}>
                {cell.value}
              </p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FleetPreviewSection({ rows, onNavigate }) {
  if (!rows.length) return null;

  return (
    <section className="mt-2.5" aria-label="Fleet preview">
      <SectionEyebrow>Fleet preview</SectionEyebrow>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const battery = vehicleBatteryPercent(row.vehicle);
          const activity = row.status || row.line.split(' · ')[0];

          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onNavigate('fleet')}
                className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition active:brightness-110"
              >
                <FleetVehicleThumbnail
                  vehicle={row.vehicle}
                  ownership={row.ownership}
                  tone={row.tone}
                  className="h-[3.25rem] w-[3.25rem] rounded-[13px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-white">{row.name}</p>
                    <p className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.04em] ${statusLabelClasses[row.tone] || statusLabelClasses.neutral}`}>
                      {activity}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-white/50">{row.line}</p>
                  {battery !== null && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${battery < 20 ? 'bg-amber-400' : 'bg-[#599CE7]'}`}
                        style={{ width: `${battery}%` }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" strokeWidth={2} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecommendedActionSection({ recommendation, syncState, onNavigate, onRetrySync }) {
  const styles = actionToneClasses[recommendation.tone] || actionToneClasses.action;
  const isReady = recommendation.tone === 'ready';

  const handleAction = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    onNavigate(recommendation.route || 'fleet');
  };

  return (
    <section className="mt-2.5" aria-label="Recommended action">
      <SectionEyebrow>Recommended action</SectionEyebrow>
      <div className={`rounded-xl border border-l-[3px] bg-white/[0.03] p-3 ${styles.border} ${styles.rail}`}>
        <p className="text-[14px] font-semibold leading-snug text-white">{recommendation.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/55">{recommendation.subtitle}</p>
        {!isReady && (
          <button
            type="button"
            onClick={handleAction}
            disabled={syncState === 'loading'}
            className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition active:brightness-110 disabled:opacity-60 ${styles.button || 'border border-white/10 text-white'}`}
          >
            {recommendation.action === 'retry' ? 'Retry sync' : 'Take action'}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </section>
  );
}

export default function FleetCommandHome({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  onRetrySync = () => {},
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const hero = getCommandEarningsHero(realFleet, totalEarnings, syncState);
  const strip = getCommandFleetStatusStrip(fleet, realFleet);
  const previewRows = getFleetVisibilityRows(fleet, realFleet, 3);
  const recommendation = getFleetRecommendation(realFleet, realSyncStatus);

  return (
    <div className="bg-[#0a0a0a] px-4 pb-6 pt-3">
      <header className="mb-3 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1rem]" />
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#599CE7]/30 bg-[#599CE7]/10 text-[10px] font-bold text-[#87c3ff]"
          aria-label="Account"
        >
          ●
        </button>
      </header>

      <EarningsHero hero={hero} />
      <TripsShareRow hero={hero} />
      <FleetStatusStrip strip={strip} onNavigate={onNavigate} />

      <div className="mt-2.5">
        <CommandMapPreview fleet={fleet} realFleet={realFleet} onNavigate={onNavigate} compact />
      </div>

      <FleetPreviewSection rows={previewRows} onNavigate={onNavigate} />
      <RecommendedActionSection
        recommendation={recommendation}
        syncState={syncState}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
      />
    </div>
  );
}
