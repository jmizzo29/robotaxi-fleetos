import MobileVehicleRender from '../components/MobileVehicleRender';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0';
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function MiniMetric({ label, value, tone, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-lg shadow-black/20">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d={icon} fill="currentColor" />
        </svg>
      </div>
      <p className="text-[12px] font-semibold leading-tight text-slate-200">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p>
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
      className="relative h-[330px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#202225] text-left shadow-2xl shadow-black/25"
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
            <div className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-xl ${
              real
                ? 'border-sky-300 bg-sky-500 shadow-sky-500/40'
                : vehicle.anomalyRisk > 18
                  ? 'border-rose-200 bg-rose-500 shadow-rose-500/35'
                  : 'border-white/25 bg-slate-600 shadow-black/30'
            }`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" aria-hidden="true">
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
  const vehicle = primaryTesla || fleet[0] || {};
  const alerts = avgAnomalyRisk > 15 ? 'High' : avgAnomalyRisk > 8 ? 'Med' : 'Low';
  const syncTone = syncStatus?.state === 'error'
    ? 'border-rose-400/25 bg-rose-400/10 text-rose-100'
    : syncStatus?.state === 'success'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
      : 'border-sky-400/25 bg-sky-400/10 text-sky-100';

  return (
    <section className="space-y-4 lg:hidden">
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">FleetOS</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Home Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200"
          aria-label="Open settings"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="currentColor" d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8.7 5.4-1.9.6a7.2 7.2 0 0 1-.7 1.7l.9 1.8-1.6 1.6-1.8-.9c-.5.3-1.1.5-1.7.7l-.6 1.9h-2.3l-.6-1.9a7.2 7.2 0 0 1-1.7-.7l-1.8.9-1.6-1.6.9-1.8a7.2 7.2 0 0 1-.7-1.7l-1.9-.6v-2.3l1.9-.6c.2-.6.4-1.2.7-1.7l-.9-1.8 1.6-1.6 1.8.9c.5-.3 1.1-.5 1.7-.7l.6-1.9h2.3l.6 1.9c.6.2 1.2.4 1.7.7l1.8-.9 1.6 1.6-.9 1.8c.3.5.5 1.1.7 1.7l1.9.6v2.3Z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniMetric
          label="Active Vehicles"
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

      <MapPreview fleet={fleet} onNavigate={onNavigate} />

      <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/20">
        <div className="relative h-40 overflow-hidden bg-[radial-gradient(circle_at_25%_18%,rgba(14,165,233,0.24),transparent_34%),linear-gradient(135deg,#171a20,#070914)]">
          <MobileVehicleRender className="absolute inset-x-[-10px] bottom-[-12px] mx-auto h-40 w-[108%]" />
          <div className="absolute left-4 top-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Primary Vehicle</p>
            <h2 className="mt-1 text-2xl font-black text-white">{vehicle.name || vehicle.display_name || vehicle.id || 'No Vehicle'}</h2>
          </div>
          <span className="absolute right-4 top-4 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase text-emerald-200">
            {vehicle.status || vehicle.state || 'Ready'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/10">
          <div className="bg-[#151821] p-3">
            <p className="text-[11px] font-semibold text-slate-400">Battery</p>
            <p className="mt-1 text-xl font-black text-white">{Number.isFinite(vehicle.battery) ? `${Math.round(vehicle.battery)}%` : '--'}</p>
          </div>
          <div className="bg-[#151821] p-3">
            <p className="text-[11px] font-semibold text-slate-400">Revenue</p>
            <p className="mt-1 text-xl font-black text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-[#151821] p-3">
            <p className="text-[11px] font-semibold text-slate-400">Speed</p>
            <p className="mt-1 text-xl font-black text-white">{vehicle.speed || 0}<span className="text-[11px] text-slate-400"> mph</span></p>
          </div>
        </div>
        <div className={`border-t px-3 py-3 text-xs font-semibold ${syncTone}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">{syncStatus?.message || 'Tesla telemetry ready'}</span>
            <span className="shrink-0">{formatTime(syncStatus?.lastSyncedAt || vehicle.syncedAt)}</span>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          label={isLoading ? 'Syncing' : 'Sync Tesla'}
          detail={syncStatus?.state === 'success' ? `Updated ${formatTime(syncStatus.lastSyncedAt)}` : 'Refresh telemetry'}
          tone="border-emerald-400/20 bg-emerald-400/10"
          onClick={onSync}
          disabled={isLoading}
        />
        <ActionTile
          label="Plan Tonight"
          detail="Open dispatch planner"
          tone="border-sky-400/20 bg-sky-400/10"
          onClick={() => onNavigate('dispatch')}
        />
        <ActionTile
          label="AI Review"
          detail="Queue operator analysis"
          tone="border-violet-400/20 bg-violet-400/10"
          onClick={() => onExecute('Mobile AI operator review requested', 'HIGH')}
        />
        <ActionTile
          label="Finance"
          detail="Check fleet ROI"
          tone="border-amber-400/20 bg-amber-400/10"
          onClick={() => onNavigate('finance')}
        />
      </div>
    </section>
  );
}
