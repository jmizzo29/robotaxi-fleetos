import RoboWordmark from '../components/RoboWordmark';

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

      {/* Simple Vehicles at a Glance (clean, not busy) */}
      <div className="pt-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 mb-2 px-1">Vehicles</p>
        <div className="space-y-2">
          {fleet.slice(0, 3).map((v) => (
            <button
              key={v.id}
              onClick={() => onNavigate('fleet')}
              className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left active:bg-white/10"
            >
              <div>
                <p className="text-sm font-black text-white">{v.id}</p>
                <p className="text-[11px] text-slate-400">{v.city || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">{v.battery ? `${Math.round(v.battery)}%` : '--'}</p>
                <p className="text-[10px] text-slate-400">{v.status}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
