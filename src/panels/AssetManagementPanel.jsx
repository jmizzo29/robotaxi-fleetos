import { useEffect, useState } from 'react';
import {
  getVehicleOwnership,
  getVehicleOwnershipKey,
  resetVehicleOwnership,
  saveVehicleOwnership,
  syncSavedOwnershipFromBackend,
} from '../data/vehicleOwnership';
import { canRevealVin, maskVin } from '../utils/vinPrivacy';
import VehicleOnboardingPanel from './VehicleOnboardingPanel';

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

const fields = [
  ['modelYear', 'Model Year', 'number'],
  ['purchaseYear', 'Year Purchased', 'number'],
  ['model', 'Model', 'text'],
  ['trim', 'Trim', 'text'],
  ['color', 'Color', 'text'],
  ['tag', 'Tag', 'text'],
  ['purchaseDate', 'Purchased', 'date'],
  ['pricePaid', 'Price Paid', 'number'],
  ['currentBalance', 'Balance', 'number'],
  ['monthlyPayment', 'Monthly Payment', 'number'],
  ['lender', 'Lender', 'text'],
  ['registrationState', 'Registration', 'text'],
  ['insuranceRenewal', 'Insurance Renewal', 'date'],
];

function Field({ label, name, type, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-100 outline-none"
      />
    </label>
  );
}

export default function AssetManagementPanel({
  fleet = [],
  isLoading = false,
  onSync,
}) {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((current) => current + 1);
    syncSavedOwnershipFromBackend().then(refresh).catch(refresh);
    window.addEventListener('fleetos-ownership-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('fleetos-ownership-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

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
      <VehicleOnboardingPanel fleet={fleet} isLoading={isLoading} onSync={onSync} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Acquisition Cost" value={formatCurrency(totalAcquisition)} tone="text-sky-300" />
        <SummaryCard label="Outstanding Balance" value={formatCurrency(totalBalance)} tone="text-amber-300" />
        <SummaryCard label="Estimated Equity" value={formatCurrency(equity)} tone="text-emerald-300" />
        <SummaryCard label="Monthly Payments" value={formatCurrency(monthlyPayments)} tone="text-violet-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {assets.map(({ vehicle, ownership }) => (
          <EditableAssetCard
            key={`${vehicle.id}-${JSON.stringify(ownership)}`}
            vehicle={vehicle}
            ownership={ownership}
            onSaved={() => setRevision((current) => current + 1)}
          />
        ))}
      </div>
    </section>
  );
}

function EditableAssetCard({ vehicle, ownership, onSaved }) {
  const [draft, setDraft] = useState(() => ownership);
  const [showVin, setShowVin] = useState(false);
  const [message, setMessage] = useState('');
  const key = getVehicleOwnershipKey(vehicle);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    setMessage('Saving asset record...');
    try {
      await saveVehicleOwnership(key, draft);
      setMessage('Asset record saved to Postgres.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message || 'Asset record could not be saved.');
    }
  };

  const handleReset = async () => {
    setMessage('Resetting asset record...');
    try {
      await resetVehicleOwnership(key);
      setMessage('Asset record reset in Postgres.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message || 'Asset record could not be reset.');
    }
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Editable Asset Record
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            {vehicle.name || vehicle.display_name || vehicle.id}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {draft.modelYear} {draft.model} - {draft.tag}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{showVin ? vehicle.vin || 'VIN unavailable' : maskVin(vehicle.vin)}</span>
            {canRevealVin(vehicle.vin) && (
              <button
                type="button"
                onClick={() => setShowVin((current) => !current)}
                className="text-sky-300 hover:text-sky-200"
              >
                {showVin ? 'Hide VIN' : 'Reveal VIN'}
              </button>
            )}
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-black uppercase text-slate-300">
          {vehicle.isReal ? 'Real' : 'Sim'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map(([name, label, type]) => (
          <Field
            key={name}
            label={label}
            name={name}
            type={type}
            value={draft[name]}
            onChange={handleChange}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
        >
          Save Record
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          Reset Defaults
        </button>
        <div className="rounded-md border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-400">
          Purchased {formatDate(draft.purchaseDate)} / {formatCurrency(Number(draft.pricePaid))}
        </div>
      </div>
      {message && <p className="mt-3 text-sm font-semibold text-slate-400">{message}</p>}
    </article>
  );
}
