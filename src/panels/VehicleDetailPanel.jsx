import LocationIntelligencePanel from '../components/LocationIntelligencePanel';
import VehicleIdentityPlate from '../components/VehicleIdentityPlate';
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { maskVin } from '../utils/vinPrivacy';
import OwnerIntelligencePanel from './OwnerIntelligencePanel';
import TripParkingHistoryPanel from './TripParkingHistoryPanel';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return 'Unavailable';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return 'Unavailable';
  return new Date(value).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 truncate text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-sm last:border-b-0">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] truncate text-right font-bold text-slate-100">{value}</span>
    </div>
  );
}

export default function VehicleDetailPanel({
  vehicle,
  onSync,
  isLoading,
  onShowMap,
  onQueueCommand,
}) {
  if (!vehicle) {
    return (
      <section className="rounded-lg border border-white/10 bg-slate-900/80 p-6 text-slate-300">
        Select a vehicle from the fleet registry to inspect telemetry and controls.
      </section>
    );
  }

  const name = vehicle.name || vehicle.display_name || vehicle.id;
  const status = vehicle.status || vehicle.state || 'Unknown';
  const battery = Number.isFinite(vehicle.battery) ? Math.round(vehicle.battery) : 0;
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle);
  const equity = ownership ? Math.max(0, ownership.pricePaid - ownership.currentBalance) : null;

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-lg shadow-black/10">
        <div className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_18%,rgba(14,165,233,0.2),transparent_34%),radial-gradient(circle_at_15%_75%,rgba(16,185,129,0.16),transparent_32%)]" />
          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  {vehicle.isReal ? 'Real Tesla' : 'Simulated Vehicle'}
                </p>
                <h2 className="text-4xl font-black tracking-tight">{name}</h2>
                <p className="mt-2 text-sm text-slate-400">{vehicle.vin ? maskVin(vehicle.vin) : vehicle.assignment || 'FleetOS vehicle record'}</p>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase text-emerald-200">
                {status}
              </span>
            </div>

            <VehicleIdentityPlate vehicle={vehicle} ownership={ownership} className="my-5" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Battery" value={`${battery}%`} tone={battery < 30 ? 'text-amber-300' : 'text-emerald-300'} />
              <StatCard label="Speed" value={`${Math.round(vehicle.speed || 0)} mph`} tone="text-sky-300" />
              <StatCard label="Risk" value={`${Math.round(vehicle.anomalyRisk || 0)}%`} tone={(vehicle.anomalyRisk || 0) > 20 ? 'text-rose-300' : 'text-slate-100'} />
              <StatCard label="Health" value={`${Math.round(vehicle.maintenanceScore || 90)}%`} tone="text-violet-300" />
            </div>
          </div>
        </div>
      </article>

      <div className="space-y-4">
        <OwnerIntelligencePanel vehicle={vehicle} />
        <LocationIntelligencePanel vehicle={vehicle} onShowMap={onShowMap} />
        <TripParkingHistoryPanel vehicle={vehicle} />

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Ownership & Finance
          </p>
          <DetailRow label="Model Year" value={ownership?.modelYear || 'Unavailable'} />
          <DetailRow label="Model" value={ownership?.model || 'Unavailable'} />
          <DetailRow label="Trim" value={ownership?.trim || 'Unavailable'} />
          <DetailRow label="Color" value={ownership?.color || 'Unavailable'} />
          <DetailRow label="Tag" value={ownership?.tag || 'Unavailable'} />
          <DetailRow label="Year Purchased" value={ownership?.purchaseYear || 'Unavailable'} />
          <DetailRow label="Purchased" value={formatDate(ownership?.purchaseDate)} />
          <DetailRow label="Price Paid" value={formatCurrency(ownership?.pricePaid)} />
          <DetailRow label="Balance" value={formatCurrency(ownership?.currentBalance)} />
          <DetailRow label="Estimated Equity" value={formatCurrency(equity)} />
          <DetailRow label="Monthly Payment" value={formatCurrency(ownership?.monthlyPayment)} />
          <DetailRow label="Lender" value={ownership?.lender || 'Unavailable'} />
          <DetailRow label="Registration" value={ownership ? `${ownership.registrationState} - renews ${formatDate(ownership.insuranceRenewal)}` : 'Unavailable'} />
        </article>

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Telemetry
          </p>
          <DetailRow label="Charging" value={vehicle.chargingState || 'Unavailable'} />
          <DetailRow label="Odometer" value={vehicle.odometer ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : 'Unavailable'} />
          <DetailRow label="Locked" value={vehicle.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'} />
          <DetailRow label="GPS" value={vehicle.gpsAsOf ? 'Live' : 'Unavailable'} />
          <DetailRow label="Software" value={vehicle.softwareVersion || 'Unavailable'} />
        </article>

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Controls
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onSync}
              disabled={isLoading}
              className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? 'Syncing...' : 'Sync Telemetry'}
            </button>
            <button
              type="button"
              onClick={onShowMap}
              className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
            >
              Show On Map
            </button>
            <button
              type="button"
              onClick={() => onQueueCommand?.(`AI review requested for ${name}`, 'AI')}
              className="rounded-md border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
            >
              AI Review
            </button>
            <button
              type="button"
              onClick={() => onQueueCommand?.(`Schedule service review for ${name}`, 'NORMAL')}
              className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              Service Review
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
