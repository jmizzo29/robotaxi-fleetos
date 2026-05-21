function formatValue(value, suffix = '') {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()}${suffix}` : 'Unavailable';
}

function readinessFor(vehicle) {
  const battery = Number(vehicle?.battery);
  const chargingState = `${vehicle?.chargingState || ''}`.toLowerCase();
  const isCharging = chargingState.includes('charging');

  if (isCharging) {
    return {
      label: 'Charging',
      tone: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
      action: 'Keep charging until dispatch window',
    };
  }

  if (!Number.isFinite(battery)) {
    return {
      label: 'Needs Sync',
      tone: 'border-slate-400/20 bg-slate-400/10 text-slate-200',
      action: 'Refresh telemetry before assigning',
    };
  }

  if (battery < 35) {
    return {
      label: 'Charge Now',
      tone: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
      action: 'Route to nearest charger',
    };
  }

  if (battery < 55) {
    return {
      label: 'Charge Soon',
      tone: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
      action: 'Use for short trips only',
    };
  }

  return {
    label: 'Dispatch Ready',
    tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    action: 'Eligible for active assignment',
  };
}

function estimatedRange(vehicle) {
  const battery = Number(vehicle?.battery);
  if (!Number.isFinite(battery)) return null;

  const usableRange = vehicle?.isReal ? 238 : 265;
  return Math.round((battery / 100) * usableRange);
}

function Metric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function BatteryBar({ value }) {
  const battery = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
  const color = battery < 35 ? 'bg-rose-300' : battery < 55 ? 'bg-amber-300' : 'bg-emerald-300';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-950">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${battery}%` }} />
    </div>
  );
}

function VehicleChargeRow({ vehicle, onQueueCommand }) {
  const readiness = readinessFor(vehicle);
  const range = estimatedRange(vehicle);

  const handlePlan = () => {
    onQueueCommand?.(
      `Charging plan requested for ${vehicle.name || vehicle.display_name || vehicle.id}: ${readiness.action}`,
      readiness.label === 'Charge Now' ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${readiness.tone}`}>
              {readiness.label}
            </span>
            {vehicle.isReal && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-200">
                Tesla
              </span>
            )}
          </div>
          <h3 className="truncate text-xl font-black tracking-tight">
            {vehicle.name || vehicle.display_name || vehicle.id}
          </h3>
          <p className="mt-1 text-sm text-slate-400">{readiness.action}</p>
        </div>

        <button
          type="button"
          onClick={handlePlan}
          className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
        >
          Plan Charge
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Battery</p>
          <p className="mt-1 text-lg font-black">{formatValue(vehicle.battery, '%')}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Est. Range</p>
          <p className="mt-1 text-lg font-black">{range ? `${range} mi` : 'Unavailable'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Charging</p>
          <p className="mt-1 truncate text-lg font-black">{vehicle.chargingState || 'Unavailable'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Utilization</p>
          <p className="mt-1 text-lg font-black">{formatValue(vehicle.utilization, '%')}</p>
        </div>
      </div>

      <div className="mt-4">
        <BatteryBar value={vehicle.battery} />
      </div>
    </article>
  );
}

export default function ChargingReadinessPanel({ fleet = [], onQueueCommand }) {
  const enriched = fleet.map((vehicle) => ({
    ...vehicle,
    readiness: readinessFor(vehicle),
    range: estimatedRange(vehicle),
  }));

  const dispatchReady = enriched.filter((vehicle) => vehicle.readiness.label === 'Dispatch Ready').length;
  const chargeNow = enriched.filter((vehicle) => vehicle.readiness.label === 'Charge Now').length;
  const charging = enriched.filter((vehicle) => vehicle.readiness.label === 'Charging').length;
  const avgBattery = enriched.length
    ? Math.round(enriched.reduce((sum, vehicle) => sum + (Number(vehicle.battery) || 0), 0) / enriched.length)
    : 0;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Dispatch Ready" value={dispatchReady} tone="text-emerald-300" />
        <Metric label="Charging" value={charging} tone="text-sky-300" />
        <Metric label="Charge Now" value={chargeNow} tone={chargeNow ? 'text-rose-300' : 'text-slate-100'} />
        <Metric label="Avg Battery" value={`${avgBattery}%`} tone={avgBattery < 45 ? 'text-amber-300' : 'text-emerald-300'} />
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Charging Intelligence
            </p>
            <h2 className="text-2xl font-black tracking-tight">Fleet Energy Board</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              This translates Tesla charge telemetry into dispatch decisions. The next API step is adding confirmed charge controls like start charge, stop charge, and charge limit.
            </p>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
            Control commands staged for confirmation flow
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {enriched
          .sort((a, b) => (Number(a.battery) || 0) - (Number(b.battery) || 0))
          .map((vehicle) => (
            <VehicleChargeRow
              key={vehicle.vin || vehicle.id}
              vehicle={vehicle}
              onQueueCommand={onQueueCommand}
            />
          ))}
      </div>
    </section>
  );
}
