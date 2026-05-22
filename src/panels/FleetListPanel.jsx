import { useMemo, useState } from 'react';
import VehicleIdentityPlate from '../components/VehicleIdentityPlate';
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
        <VehicleIdentityPlate vehicle={vehicle} ownership={ownership} compact />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-black text-slate-100">{vehicle.name || vehicle.display_name || vehicle.id}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${vehicle.isReal ? 'bg-emerald-400/10 text-emerald-200' : 'bg-sky-400/10 text-sky-200'}`}>
            {vehicle.isReal ? 'Real' : 'Sim'}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          {ownership ? `${ownership.modelYear} ${ownership.model} - ${ownership.color} - ${ownership.tag}` : vehicle.assignment || vehicle.status || vehicle.state}
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('real');
  const [selectedKey, setSelectedKey] = useState('');

  const filteredFleet = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = fleet
      .filter((vehicle) => {
        if (filter === 'real' && !vehicle.isReal) return false;
        if (filter === 'attention' && Number(vehicle.battery || 0) >= 35 && Number(vehicle.anomalyRisk || 0) < 20) return false;
        if (filter === 'available' && !['PARKED', 'IDLE', 'online'].includes(vehicle.status || vehicle.state)) return false;
        if (!normalizedQuery) return true;
        const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
        return [
          vehicle.name,
          vehicle.display_name,
          vehicle.id,
          vehicle.vin,
          vehicle.status,
          vehicle.state,
          ownership.model,
          ownership.tag,
          ownership.color,
        ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
      });

    return result.sort((a, b) => {
      if (sort === 'battery') return Number(a.battery || 0) - Number(b.battery || 0);
      if (sort === 'revenue') return Number(b.revenue || 0) - Number(a.revenue || 0);
      if (sort === 'risk') return Number(b.anomalyRisk || 0) - Number(a.anomalyRisk || 0);
      return Number(Boolean(b.isReal)) - Number(Boolean(a.isReal));
    });
  }, [filter, fleet, query, sort]);

  const selectedVehicle = filteredFleet.find((vehicle) => (vehicle.vin || vehicle.id) === selectedKey);

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

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, VIN, tag, model, status..."
          className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-bold text-slate-100 outline-none transition focus:border-sky-300"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-bold text-slate-100 outline-none"
        >
          <option value="all">All vehicles</option>
          <option value="real">Real Teslas</option>
          <option value="available">Available / parked</option>
          <option value="attention">Needs attention</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-bold text-slate-100 outline-none"
        >
          <option value="real">Real first</option>
          <option value="battery">Lowest battery</option>
          <option value="revenue">Highest revenue</option>
          <option value="risk">Highest risk</option>
        </select>
      </div>

      <div className="mb-5 rounded-lg border border-white/10 bg-slate-950/50 p-3 lg:hidden">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Quick Select</p>
        <select
          value={selectedKey}
          onChange={(event) => {
            setSelectedKey(event.target.value);
            const vehicle = filteredFleet.find((item) => (item.vin || item.id) === event.target.value);
            if (vehicle) onSelect?.({ ...vehicle, ownership: vehicle.ownership || getVehicleOwnership(vehicle) });
          }}
          className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
        >
          <option value="">Select vehicle...</option>
          {filteredFleet.map((vehicle) => (
            <option key={vehicle.vin || vehicle.id} value={vehicle.vin || vehicle.id}>
              {vehicle.name || vehicle.display_name || vehicle.id} - {Math.round(vehicle.battery || 0)}%
            </option>
          ))}
        </select>
        {selectedVehicle && (
          <p className="mt-2 text-xs text-slate-500">
            Selected {selectedVehicle.name || selectedVehicle.display_name || selectedVehicle.id}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {filteredFleet.map((vehicle) => (
          <FleetRow key={vehicle.id} vehicle={vehicle} onSelect={onSelect} />
        ))}
        {filteredFleet.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
            No vehicles match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}
