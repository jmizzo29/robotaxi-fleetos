import VehicleIdentityPlate from '../components/VehicleIdentityPlate';
import RoboWordmark from '../components/RoboWordmark';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0';
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function MiniMetric({ label, value, tone, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 shadow-lg shadow-black/20">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${tone}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d={icon} fill="currentColor" />
        </svg>
      </div>
      <p className="text-[11px] font-semibold leading-tight text-slate-300">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function formatTime(value) {
  if (!value) return 'Not synced';

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ActionTile({ label, detail, tone, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[58px] rounded-2xl border px-3 py-3 text-left shadow-lg shadow-black/15 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 ${tone}`}
    >
      <span className="block text-sm font-black text-white">{label}</span>
      <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-300">{detail}</span>
    </button>
  );
}

function MapPreview({ fleet = [], onNavigate }) {
  const visible = fleet.slice(0, 9);

  return (
    <button
      type="button"
      onClick={() => onNavigate('map')}
      className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#202225] text-left shadow-2xl shadow-black/25"
    >
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:54px_54px]" />
        <div className="absolute left-[-20%] top-[18%] h-14 w-[145%] rotate-[28deg] rounded-full border-y border-white/12 bg-white/[0.03]" />
        <div className="absolute left-[-22%] top-[52%] h-16 w-[150%] -rotate-[14deg] rounded-full border-y border-white/12 bg-white/[0.03]" />
        <div className="absolute left-[36%] top-[-12%] h-[128%] w-16 rotate-[2deg] rounded-full border-x border-white/12 bg-white/[0.03]" />
        <div className="absolute left-[66%] top-[-18%] h-[140%] w-14 rotate-[24deg] rounded-full border-x border-white/12 bg-white/[0.03]" />
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-200">
        Live Map
      </div>

      {visible.map((vehicle, index) => {
        const positions = [
          [49, 45],
          [26, 22],
          [77, 25],
          [20, 66],
          [74, 70],
          [44, 83],
          [86, 50],
          [15, 40],
          [58, 18],
        ];
        const [left, top] = positions[index] || [50, 50];
        const real = vehicle.isReal;

        return (
          <div
            key={vehicle.vin || vehicle.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-xl ${
              real
                ? 'border-sky-300 bg-sky-500 shadow-sky-500/40'
                : vehicle.anomalyRisk > 18
                  ? 'border-rose-200 bg-rose-500 shadow-rose-500/35'
                  : 'border-white/25 bg-slate-600 shadow-black/30'
            }`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden="true">
                <path fill="currentColor" d="M5 11h14l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4l2-5Zm2-5h10l2 5H5l2-5Z" />
              </svg>
            </div>
            {real && <div className="mt-1 h-5 w-1 rounded-full bg-sky-500" />}
          </div>
        );
      })}
    </button>
  );
}

export default function MobileCommandDashboard({
  fleet = [],
  primaryTesla,
  totalRevenue,
  avgAnomalyRisk,
  onSync,
  onExecute,
  onNavigate,
  isLoading,
  syncStatus,
}) {
  const active = fleet.filter((vehicle) => vehicle.status !== 'OFFLINE').length;
  const utilization = fleet.length
    ? Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.utilization || 0), 0) / fleet.length)
    : 0;
  const alerts = avgAnomalyRisk > 15 ? 'High' : avgAnomalyRisk > 8 ? 'Med' : 'Low';

  return (
    <section className="space-y-5 lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm">
            <RoboWordmark colorClass="text-sky-300" />
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Command</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-slate-200"
        >
          Account
        </button>
      </div>

      {/* Clean KPIs - less busy */}
      <div className="grid grid-cols-3 gap-3">
        <MiniMetric
          label="Active"
          value={`${active}/${fleet.length || 0}`}
          tone="bg-emerald-400 text-slate-950"
          icon="M5 11h14l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4l2-5Zm2-5h10l2 5H5l2-5Z"
        />
        <MiniMetric
          label="Utilization"
          value={`${utilization}%`}
          tone="bg-amber-300 text-slate-950"
          icon="M13 2 5 13h6l-1 9 8-12h-6l1-8Z"
        />
        <MiniMetric
          label="Risk"
          value={alerts}
          tone="bg-rose-400 text-slate-950"
          icon="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"
        />
      </div>

      {/* Today's AI Plan - prominent but clean */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-black text-white">Today’s AI Plan</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300">3 actions</span>
        </div>
        <p className="text-sm text-slate-300 leading-snug">
          Raise Orlando pricing, charge Model Y after 11 PM, clean before pickup.
        </p>
        <button
          onClick={() => onNavigate('ai')}
          className="mt-3 w-full rounded-xl bg-white text-[#172231] py-2.5 text-sm font-black active:opacity-90"
        >
          Approve Plan
        </button>
      </div>

      {/* Quick Actions - clean 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          label={isLoading ? 'Syncing…' : 'Sync Tesla'}
          detail="Refresh telemetry"
          tone="border-emerald-400/20 bg-emerald-400/10"
          onClick={onSync}
          disabled={isLoading}
        />
        <ActionTile
          label="AI Review"
          detail="Get recommendations"
          tone="border-sky-400/20 bg-sky-400/10"
          onClick={() => onNavigate('ai')}
        />
        <ActionTile
          label="Map"
          detail="See live locations"
          tone="border-white/10 bg-white/5"
          onClick={() => onNavigate('map')}
        />
        <ActionTile
          label="Money"
          detail="Revenue & costs"
          tone="border-white/10 bg-white/5"
          onClick={() => onNavigate('finance')}
        />
      </div>

      {/* Minimal last sync status */}
      {syncStatus && (
        <div className="text-center text-[11px] text-slate-400">
          Last synced {formatTime(syncStatus.lastSyncedAt)} • {syncStatus.state}
        </div>
      )}
    </section>
  );
}
