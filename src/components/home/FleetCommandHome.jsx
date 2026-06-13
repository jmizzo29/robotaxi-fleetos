import { ArrowRight } from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import FleetVehicleThumbnail from './FleetVehicleThumbnail';
import { getFleetVisibilityRows } from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
  getFleetRecommendation,
} from '../../utils/vehicleDisplayUtils';

const previewStatusClasses = {
  ready: 'text-emerald-400',
  warning: 'text-[#599CE7]',
  issue: 'text-amber-300',
  neutral: 'text-white/55',
};

function Eyebrow({ children }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">{children}</p>
  );
}

function EarningsHero({ hero }) {
  return (
    <section aria-label="Net earnings today">
      <div className="rounded-[18px] border border-[#599CE7] bg-white/[0.03] px-3.5 py-4">
        <p className="text-[46px] font-bold tabular-nums leading-none tracking-[-0.04em] text-white">
          {hero.amount}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-white/65">{hero.label}</p>
        {hero.delta && (
          <p className="mt-1.5 text-[11px] font-medium text-emerald-400">{hero.delta}</p>
        )}
        {hero.hint && (
          <p className="mt-1.5 text-[11px] text-white/45">{hero.hint}</p>
        )}

        <div className="mt-3 flex gap-4 border-t border-white/[0.08] pt-2.5">
          <div>
            <p className="text-base font-bold tabular-nums leading-none text-white">{hero.trips}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/40">Trips</p>
          </div>
          <div>
            <p className="text-base font-bold tabular-nums leading-none text-white">{hero.teslaShare}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/40">Tesla Share</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FleetStatusStrip({ strip, onNavigate }) {
  const cells = [
    { key: 'active', label: 'Active', toneClass: 'text-white' },
    { key: 'charging', label: 'Charging', toneClass: 'text-[#599CE7]' },
    { key: 'offline', label: 'Offline', toneClass: 'text-amber-300' },
  ];

  return (
    <section className="mt-2.5" aria-label="Fleet status">
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map(({ key, label, toneClass }) => {
          const cell = strip[key];
          const valueClass = cell.tone === 'neutral' && key === 'active'
            ? 'text-white/70'
            : cell.tone === 'neutral'
              ? 'text-white/70'
              : toneClass;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key === 'charging' ? 'charging' : 'fleet')}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-1 py-2.5 text-center transition active:brightness-110"
            >
              <p className={`text-xl font-bold tabular-nums leading-none ${valueClass}`}>
                {cell.value}
              </p>
              <p className="mt-[3px] text-[8px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</p>
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
    <section className="mt-3" aria-label="Fleet preview">
      <Eyebrow>Fleet preview</Eyebrow>
      <ul className="mt-1.5 space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onNavigate('fleet')}
              className="flex w-full items-center gap-2.5 rounded-[14px] border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left transition active:brightness-110"
            >
              <FleetVehicleThumbnail
                vehicle={row.vehicle}
                ownership={row.ownership}
                tone={row.tone}
                className="h-12 w-12 rounded-[14px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-bold text-white">{row.name}</p>
                  <p className={`shrink-0 text-[10px] font-bold ${previewStatusClasses[row.tone] || previewStatusClasses.neutral}`}>
                    {row.status}
                  </p>
                </div>
                <p className="mt-[3px] truncate text-[10px] text-white/55">{row.line}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function actionButtonLabel(recommendation) {
  if (recommendation.action === 'retry') return 'Retry sync →';
  if (recommendation.route === 'charging' || /^charge/i.test(recommendation.title)) return 'Queue charge →';
  return 'Take action →';
}

function RecommendedActionSection({ recommendation, syncState, onNavigate, onRetrySync }) {
  const isReady = recommendation.tone === 'ready';
  const borderClass = isReady
    ? 'border-emerald-500/25 border-l-emerald-400'
    : recommendation.tone === 'warning'
      ? 'border-amber-500/30 border-l-amber-400'
      : recommendation.tone === 'issue'
        ? 'border-rose-500/30 border-l-rose-400'
        : 'border-[#599CE7]/30 border-l-[#599CE7]';

  const handleAction = () => {
    if (recommendation.action === 'retry') {
      onRetrySync();
      return;
    }
    onNavigate(recommendation.route || 'fleet');
  };

  return (
    <section className="mt-3 pb-1.5" aria-label="Recommended action">
      <Eyebrow>Recommended action</Eyebrow>
      <div className={`mt-1.5 rounded-[14px] border border-l-[3px] bg-white/[0.03] p-3 ${borderClass}`}>
        <p className="text-[14px] font-semibold leading-snug text-white">{recommendation.title}</p>
        <p className="mt-1 text-[10px] leading-snug text-white/55">{recommendation.subtitle}</p>
        {!isReady && (
          <button
            type="button"
            onClick={handleAction}
            disabled={syncState === 'loading'}
            className="mt-2.5 w-full rounded-[10px] bg-[#599CE7] px-2 py-2.5 text-[11px] font-semibold text-[#0a1020] transition active:brightness-110 disabled:opacity-60"
          >
            {actionButtonLabel(recommendation)}
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
  const assetCount = strip.total || fleet.length;

  return (
    <div className="bg-[#0a0a0a] px-3.5 pb-6 pt-3">
      <header className="mb-2.5 flex items-center justify-between gap-3 px-0.5 py-1">
        <RoboWordmark className="text-[1rem] font-bold tracking-[0.06em]" />
        <p className="text-[9px] font-semibold text-emerald-400">● {assetCount} assets</p>
      </header>

      <EarningsHero hero={hero} />
      <FleetStatusStrip strip={strip} onNavigate={onNavigate} />

      <div className="mt-3">
        <CommandMapPreview fleet={fleet} realFleet={realFleet} onNavigate={onNavigate} />
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
