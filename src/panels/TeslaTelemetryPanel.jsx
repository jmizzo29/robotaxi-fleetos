function formatTime(value) {
  if (!value) return 'Not synced';

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatNumber(value, suffix = '') {
  if (!Number.isFinite(value)) return 'Unavailable';
  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default function TeslaTelemetryPanel({
  vehicle,
  syncStatus,
  isLoading,
  onSync,
}) {
  const hasVehicle = Boolean(vehicle);
  const statusTone = syncStatus?.state === 'error'
    ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
    : syncStatus?.state === 'success'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
      : 'border-sky-400/30 bg-sky-400/10 text-sky-200';

  return (
    <section className="mb-8 rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Tesla Telemetry
            </p>
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            {hasVehicle ? vehicle.name || vehicle.display_name || 'My Tesla' : 'Awaiting Vehicle'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            {hasVehicle
              ? `${vehicle.status || vehicle.state || 'Online'} · ${vehicle.chargingState || 'Charging status unavailable'}`
              : 'Sync Tesla telemetry to promote your real vehicle above the simulation layer.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`rounded-md border px-3 py-2 text-xs font-semibold ${statusTone}`}>
            {syncStatus?.message || 'Telemetry ready'}
          </div>
          <button
            type="button"
            onClick={onSync}
            disabled={isLoading}
            className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Detail label="Battery" value={hasVehicle ? formatNumber(vehicle.battery, '%') : 'Unavailable'} />
        <Detail label="State" value={hasVehicle ? vehicle.state || vehicle.status || 'Unavailable' : 'Unavailable'} />
        <Detail label="Charge" value={hasVehicle ? vehicle.chargingState || 'Unavailable' : 'Unavailable'} />
        <Detail label="Speed" value={hasVehicle ? formatNumber(vehicle.speed || 0, ' mph') : 'Unavailable'} />
        <Detail label="Miles" value={hasVehicle ? formatNumber(vehicle.odometer, ' mi') : 'Unavailable'} />
        <Detail label="Locked" value={hasVehicle && vehicle.locked !== undefined ? (vehicle.locked ? 'Yes' : 'No') : 'Unavailable'} />
        <Detail label="GPS" value={hasVehicle && vehicle.gpsAsOf ? 'Live' : 'Unavailable'} />
        <Detail label="Synced" value={formatTime(syncStatus?.lastSyncedAt || vehicle?.syncedAt)} />
      </div>
    </section>
  );
}
