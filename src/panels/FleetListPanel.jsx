import VehicleSilhouette from '../components/VehicleSilhouette';
import { getVehicleOwnership } from '../data/vehicleOwnership';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return 'Unavailable';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function FleetRow({ vehicle, onSelect }) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle);

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ ...vehicle, ownership })}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-left transition hover:border-sky-400/30 hover:bg-slate-900 lg:grid-cols-[auto_minmax(0,1fr)_220px_110px]"
    >
      <div className={`flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border ${vehicle.isReal ? 'border-emerald-300/30 bg-emerald-400/10' : 'border-sky-300/20 bg-sky-400/10'}`}>
        <VehicleSilhouette className="w-14" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-black text-slate-100">{vehicle.name || vehicle.display_name || vehicle.id}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${vehicle.isReal ? 'bg-emerald-400/10 text-emerald-200' : 'bg-sky-400/10 text-sky-200'}`}>
            {vehicle.isReal ? 'Real' : 'Sim'}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          {ownership ? `${ownership.model} - ${ownership.color} - ${ownership.tag}` : vehicle.assignment || vehicle.status || vehicle.state}
        </p>
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-2 text-xs lg:col-span-1">
        <div>
          <p className="text-slate-500">Price Paid</p>
          <p className="font-bold text-slate-100">{formatCurrency(ownership?.pricePaid)}</p>
        </div>
        <div>
          <p className="text-slate-500">Balance</p>
          <p className="font-bold text-slate-100">{formatCurrency(ownership?.currentBalance)}</p>
        </div>
      </div>
      <div className="col-span-2 text-left lg:col-span-1 lg:text-right">
        <p className="text-lg font-black text-emerald-300">{Math.round(vehicle.battery || 0)}%</p>
        <p className="text-xs text-slate-500">{vehicle.status || vehicle.state || 'Unknown'}</p>
      </div>
    </button>
  );
}

export default function FleetListPanel({ fleet = [], onSelect }) {
  const sortedFleet = [...fleet].sort((a, b) => Number(Boolean(b.isReal)) - Number(Boolean(a.isReal)));

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Fleet Registry
          </p>
          <h2 className="text-2xl font-black tracking-tight">Vehicles</h2>
        </div>
        <div className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-300">
          {fleet.filter((vehicle) => vehicle.isReal).length} real / {fleet.filter((vehicle) => !vehicle.isReal).length} simulated
        </div>
      </div>

      <div className="space-y-3">
        {sortedFleet.map((vehicle) => (
          <FleetRow key={vehicle.id} vehicle={vehicle} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
