import { useMemo, useState } from 'react';
import { Battery, MapPin, Search } from 'lucide-react';
import VehicleIdentityPlate from '../components/VehicleIdentityPlate';
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { colors, semantic, spacing, typography } from '../design/roboagentTokens';
import { AppCard } from '../components/shell';
import { Chip } from '../ui';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function FleetRow({ vehicle, onSelect }) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle);
  const battery = Math.round(Number(vehicle.battery || vehicle.batteryLevel || 0));
  const name = vehicle.name || vehicle.display_name || vehicle.id;

  return (
    <AppCard
      as="button"
      type="button"
      onClick={() => onSelect?.({ ...vehicle, ownership })}
      className="w-full text-left lg:grid lg:grid-cols-[minmax(0,1fr)_120px_100px] lg:items-center lg:gap-4"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-12 shrink-0 items-center justify-center rounded-xl border ${
          vehicle.isReal ? 'border-status-ready/25 bg-status-ready/8' : 'border-status-active/20 bg-status-active/8'
        }`}>
          <VehicleIdentityPlate vehicle={vehicle} ownership={ownership} compact />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate ${typography.body}`}>{name}</p>
            <Chip className="pointer-events-none px-2 py-0.5 text-[10px]">
              {vehicle.isReal ? 'Tesla' : 'Demo'}
            </Chip>
          </div>
          <p className={`mt-0.5 truncate ${typography.caption} text-slate-500`}>
            {ownership ? `${ownership.modelYear} ${ownership.model}` : vehicle.city || vehicle.status}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm lg:mt-0 lg:justify-end">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Battery className="h-4 w-4 text-status-ready" />
          {battery}%
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{vehicle.city || vehicle.status || '—'}</span>
        </span>
      </div>

      <p className="mt-2 text-right text-sm font-medium lg:mt-0" style={{ color: semantic.positive }}>
        {formatCurrency(ownership?.pricePaid)}
      </p>
    </AppCard>
  );
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'real', label: 'Tesla' },
  { id: 'available', label: 'Available' },
  { id: 'attention', label: 'Attention' },
];

export default function FleetListPanel({ fleet = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredFleet = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return fleet
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
          ownership.model,
          ownership.tag,
        ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => Number(Boolean(b.isReal)) - Number(Boolean(a.isReal)));
  }, [filter, fleet, query]);

  const realCount = fleet.filter((vehicle) => vehicle.isReal).length;

  return (
    <section className={`animate-fade-up ${spacing.stackSm}`}>
      <div className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div>
          <h2 className={typography.pageTitle}>Fleet</h2>
          <p className={`mt-1 ${typography.caption}`}>
            {realCount} Tesla{realCount === 1 ? '' : 's'} · {fleet.length - realCount} operating
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search vehicles"
          className="w-full rounded-2xl border border-ink/12 bg-surface-raised py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-status-active/40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Chip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFleet.map((vehicle) => (
          <FleetRow key={vehicle.id} vehicle={vehicle} onSelect={onSelect} />
        ))}
        {filteredFleet.length === 0 && (
          <AppCard className="text-center text-sm text-slate-500">
            No vehicles match your search.
          </AppCard>
        )}
      </div>
    </section>
  );
}
