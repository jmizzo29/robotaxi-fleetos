import VehicleIdentityPlate from '../components/VehicleIdentityPlate';

function BatteryBar({ value = 0 }) {
  const battery = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">Battery</span>
        <span className="font-black text-emerald-300">{Math.round(battery)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-300"
          style={{ width: `${battery}%` }}
        />
      </div>
    </div>
  );
}

function TelemetryBars({ vehicle }) {
  const bars = [
    ['Charge', vehicle?.battery || 0, 'bg-emerald-400'],
    ['Use', vehicle?.utilization || 0, 'bg-sky-400'],
    ['Health', vehicle?.maintenanceScore || 88, 'bg-violet-400'],
    ['Risk', vehicle?.anomalyRisk || 0, 'bg-rose-400'],
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {bars.map(([label, value, color]) => (
        <div key={label} className="flex h-20 flex-col justify-end rounded-lg border border-white/10 bg-slate-950/60 p-2">
          <div className="flex flex-1 items-end">
            <div
              className={`w-full rounded-sm ${color}`}
              style={{ height: `${Math.max(8, Math.min(100, value))}%` }}
            />
          </div>
          <p className="mt-2 truncate text-center text-[10px] font-semibold text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function VehicleShowcasePanel({ vehicle, fleet = [], onSync, isLoading }) {
  const simulatedPreview = fleet.filter((item) => !item.isReal).slice(0, 3);
  const status = vehicle?.status || vehicle?.state || 'Awaiting sync';

  return (
    <section className="mb-6 grid grid-cols-1 gap-4 lg:mb-8 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-lg shadow-black/10">
        <div className="relative min-h-[250px] p-4 sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.14),transparent_30%)]" />
          <div className="relative">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Featured Vehicle
                </p>
                <h2 className="text-3xl font-black tracking-tight">
                  {vehicle?.name || vehicle?.display_name || 'OCE'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {vehicle ? `${status} - ${vehicle.chargingState || 'Telemetry online'}` : 'Real Tesla telemetry appears here after sync.'}
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase text-emerald-200">
                {status}
              </span>
            </div>

            <VehicleIdentityPlate vehicle={vehicle} className="my-4" />

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.1fr]">
              <BatteryBar value={vehicle?.battery || 0} />
              <TelemetryBars vehicle={vehicle} />
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Fleet Visual
            </p>
            <h3 className="text-xl font-black tracking-tight">Active Layer</h3>
          </div>
          <button
            type="button"
            onClick={onSync}
            disabled={isLoading}
            className="rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Syncing' : 'Sync'}
          </button>
        </div>

        <div className="space-y-3">
          {[vehicle, ...simulatedPreview].filter(Boolean).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
              <div className={`h-10 w-10 rounded-lg border ${item.isReal ? 'border-emerald-300/30 bg-emerald-400/10' : 'border-sky-300/20 bg-sky-400/10'} flex items-center justify-center`}>
                <VehicleIdentityPlate vehicle={item} compact />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-100">{item.name || item.display_name || item.id}</p>
                <p className="truncate text-xs text-slate-500">{item.status || item.state || item.assignment}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-300">{Math.round(item.battery || 0)}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {item.isReal ? 'Real' : 'Sim'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
