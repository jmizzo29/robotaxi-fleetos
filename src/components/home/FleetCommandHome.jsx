import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import CommandVehicleAsset from './CommandVehicleAsset';
import CommandLivePulse from './CommandLivePulse';
import { getFleetVisibilityRows } from '../../utils/commandHomeUtils';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
  getFleetRecommendation,
  hasTrustedFleetRevenue,
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

function EarningsHero({ hero, isLive }) {
  return (
    <section aria-label="Net earnings today" className="relative">
      {isLive && (
        <div
          className="command-hero-glow pointer-events-none absolute -inset-1 rounded-[20px] bg-[#599CE7]/20 blur-xl"
          aria-hidden="true"
        />
      )}
      <div className="relative overflow-hidden rounded-[18px] border border-[#599CE7] bg-[#0b1018] px-3.5 py-4 command-hero-sheen">
        <p className="text-[46px] font-bold tabular-nums leading-none tracking-[-0.04em] text-white [text-shadow:0_0_24px_rgba(89,156,231,0.18)]">
          {hero.amount}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-white/70">{hero.label}</p>
        {hero.delta && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 command-led-live" />
            {hero.delta}
          </p>
        )}
        {hero.hint && (
          <p className="mt-1.5 text-[11px] text-white/45">{hero.hint}</p>
        )}

        <div className="mt-3 flex gap-4 border-t border-[#599CE7]/15 pt-2.5">
          <div>
            <p className="text-base font-bold tabular-nums leading-none text-white">{hero.trips}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#599CE7]/70">Trips</p>
          </div>
          <div>
            <p className="text-base font-bold tabular-nums leading-none text-white">{hero.teslaShare}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#599CE7]/70">Tesla Share</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FleetStatusStrip({ strip, onNavigate }) {
  const cells = [
    { key: 'active', label: 'Active', toneClass: 'text-white', liveClass: 'command-status-live bg-emerald-500/[0.06] border-emerald-500/20' },
    { key: 'charging', label: 'Charging', toneClass: 'text-[#87c3ff]', liveClass: 'bg-[#599CE7]/[0.08] border-[#599CE7]/25' },
    { key: 'offline', label: 'Offline', toneClass: 'text-amber-300', liveClass: 'bg-amber-500/[0.05] border-amber-500/15' },
  ];

  return (
    <section className="mt-2.5" aria-label="Fleet status">
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map(({ key, label, toneClass, liveClass }) => {
          const cell = strip[key];
          const count = Number(cell.value) || 0;
          const isActiveCell = key === 'active' && count > 0;
          const valueClass = cell.tone === 'neutral' ? 'text-white/70' : toneClass;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key === 'charging' ? 'charging' : 'fleet')}
              className={`relative rounded-xl border px-1 py-2.5 text-center transition active:brightness-110 ${liveClass} ${isActiveCell ? 'command-status-live' : ''}`}
            >
              {isActiveCell && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 command-led-live" aria-hidden="true" />
              )}
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
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Eyebrow>Fleet preview</Eyebrow>
        <CommandLivePulse tone="live" label="Live" />
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const isMoving = /route|online|service/i.test(row.status);
          const isCharging = /charg/i.test(row.status);

          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onNavigate('fleet')}
                className="flex w-full items-center gap-2.5 rounded-[14px] border border-white/10 bg-[#0b0d12] px-2.5 py-2 text-left transition active:brightness-110"
              >
                <CommandVehicleAsset status={row.status} tone={row.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-white">{row.name}</p>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      {(isMoving || isCharging) && (
                        <CommandLivePulse tone={isCharging ? 'charge' : 'live'} />
                      )}
                      <span className={`text-[10px] font-bold ${previewStatusClasses[row.tone] || previewStatusClasses.neutral}`}>
                        {row.status}
                      </span>
                    </span>
                  </div>
                  <p className="mt-[3px] truncate text-[10px] text-white/55">{row.line}</p>
                </div>
              </button>
            </li>
          );
        })}
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
    ? 'border-emerald-500/25 border-l-emerald-400 bg-emerald-500/[0.04]'
    : recommendation.tone === 'warning'
      ? 'border-amber-500/30 border-l-amber-400 bg-amber-500/[0.04]'
      : recommendation.tone === 'issue'
        ? 'border-rose-500/30 border-l-rose-400 bg-rose-500/[0.04]'
        : 'border-[#599CE7]/30 border-l-[#599CE7] bg-[#599CE7]/[0.05]';

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
      <div className={`mt-1.5 rounded-[14px] border border-l-[3px] p-3 ${borderClass}`}>
        {!isReady && (
          <CommandLivePulse
            tone={recommendation.tone === 'warning' ? 'warn' : 'charge'}
            label="Needs attention"
            className="mb-1.5"
          />
        )}
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
  const earningsLive = hasTrustedFleetRevenue(realFleet, totalEarnings, syncState);
  const activeCount = Number(strip.active.value) || 0;

  return (
    <div className="bg-[#0a0a0a] px-3.5 pb-6 pt-3">
      <header className="mb-2.5 flex items-center justify-between gap-3 px-0.5 py-1">
        <RoboWordmark
          className="text-[1rem] tracking-[0.08em] [text-shadow:0_0_20px_rgba(89,156,231,0.25)]"
          colorClass="text-white"
        />
        <CommandLivePulse
          tone={activeCount > 0 ? 'live' : 'warn'}
          label={`${assetCount} assets`}
        />
      </header>

      <EarningsHero hero={hero} isLive={earningsLive} />
      <FleetStatusStrip strip={strip} onNavigate={onNavigate} />

      <div className="mt-3">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          onNavigate={onNavigate}
          activeCount={activeCount}
        />
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
