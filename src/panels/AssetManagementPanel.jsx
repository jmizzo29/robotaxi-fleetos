import { getVehicleOwnership } from '../data/vehicleOwnership';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return 'Unavailable';
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SummaryCard({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        readOnly
        value={value || ''}
        className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-100 outline-none"
      />
    </label>
  );
}

export default function AssetManagementPanel({ fleet = [] }) {
  const assets = fleet
    .map((vehicle) => ({
      vehicle,
      ownership: vehicle.ownership || getVehicleOwnership(vehicle),
    }))
    .filter((asset) => asset.ownership);

  const totalAcquisition = assets.reduce((sum, asset) => sum + (asset.ownership.pricePaid || 0), 0);
  const totalBalance = assets.reduce((sum, asset) => sum + (asset.ownership.currentBalance || 0), 0);
  const monthlyPayments = assets.reduce((sum, asset) => sum + (asset.ownership.monthlyPayment || 0), 0);
  const equity = Math.max(0, totalAcquisition - totalBalance);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Acquisition Cost" value={formatCurrency(totalAcquisition)} tone="text-sky-300" />
        <SummaryCard label="Outstanding Balance" value={formatCurrency(totalBalance)} tone="text-amber-300" />
        <SummaryCard label="Estimated Equity" value={formatCurrency(equity)} tone="text-emerald-300" />
        <SummaryCard label="Monthly Payments" value={formatCurrency(monthlyPayments)} tone="text-violet-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {assets.map(({ vehicle, ownership }) => (
          <article key={vehicle.id} className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Asset Record
                </p>
                <h2 className="text-2xl font-black tracking-tight">
                  {vehicle.name || vehicle.display_name || vehicle.id}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {ownership.modelYear} {ownership.model} - {ownership.tag}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-black uppercase text-slate-300">
                {vehicle.isReal ? 'Real' : 'Sim'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Model Year" value={ownership.modelYear} />
              <Field label="Year Purchased" value={ownership.purchaseYear} />
              <Field label="Model" value={ownership.model} />
              <Field label="Trim" value={ownership.trim} />
              <Field label="Color" value={ownership.color} />
              <Field label="Tag" value={ownership.tag} />
              <Field label="Purchased" value={formatDate(ownership.purchaseDate)} />
              <Field label="Price Paid" value={formatCurrency(ownership.pricePaid)} />
              <Field label="Balance" value={formatCurrency(ownership.currentBalance)} />
              <Field label="Monthly Payment" value={formatCurrency(ownership.monthlyPayment)} />
              <Field label="Lender" value={ownership.lender} />
              <Field label="Registration" value={ownership.registrationState} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
