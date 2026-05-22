import { useMemo, useState } from 'react';
import { getVehicleOwnershipKey, saveVehicleOwnership } from '../data/vehicleOwnership';
import { decodeVehicleVin } from '../services/ownerIntelligenceService';
import { canRevealVin, maskVin } from '../utils/vinPrivacy';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildSuggestedRecord(vehicle, decodedVin) {
  const modelName = decodedVin?.model ? `Tesla ${decodedVin.model}` : 'Tesla Vehicle';
  const year = decodedVin?.modelYear ? Number(decodedVin.modelYear) : new Date().getFullYear();

  return {
    modelYear: year,
    purchaseYear: new Date().getFullYear(),
    model: modelName,
    trim: decodedVin?.trim || '',
    color: vehicle?.colorName || vehicle?.color || '',
    tag: vehicle?.name || vehicle?.display_name || 'My Tesla',
    purchaseDate: today(),
    pricePaid: 0,
    currentBalance: 0,
    monthlyPayment: 0,
    lender: '',
    registrationState: '',
    insuranceRenewal: today(),
  };
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-300"
      />
    </label>
  );
}

export default function VehicleOnboardingPanel({
  fleet = [],
  isLoading,
  onSync,
}) {
  const realVehicles = useMemo(() => fleet.filter((vehicle) => vehicle.isReal), [fleet]);
  const [selectedVin, setSelectedVin] = useState(realVehicles[0]?.vin || '');
  const selectedVehicle = realVehicles.find((vehicle) => vehicle.vin === selectedVin) || realVehicles[0] || null;
  const [decodedVin, setDecodedVin] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [showVin, setShowVin] = useState(false);

  const syncAndPrepare = async () => {
    setStatus({ state: 'loading', message: 'Syncing Tesla and preparing an asset record...' });
    try {
      await onSync?.();
      setStatus({ state: 'success', message: 'Telemetry sync requested. Select the vehicle below once it appears.' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'Tesla sync failed.' });
    }
  };

  const enrich = async () => {
    if (!selectedVehicle?.vin) {
      setStatus({ state: 'error', message: 'Sync Tesla first so FleetOS can discover the VIN automatically.' });
      return;
    }

    setStatus({ state: 'loading', message: 'Decoding VIN with NHTSA and preparing fields...' });
    try {
      const decoded = await decodeVehicleVin(selectedVehicle.vin);
      setDecodedVin(decoded);
      setDraft(buildSuggestedRecord(selectedVehicle, decoded));
      setStatus({ state: 'success', message: 'Vehicle details auto-filled. Review only the ownership fields FleetOS cannot infer.' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'VIN enrichment failed.' });
    }
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    if (!selectedVehicle || !draft) return;
    setStatus({ state: 'loading', message: 'Saving vehicle asset record to Postgres...' });
    try {
      await saveVehicleOwnership(getVehicleOwnershipKey(selectedVehicle), draft);
      setStatus({ state: 'success', message: 'Vehicle onboarded. FleetOS saved the asset record to Postgres.' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'Vehicle asset record could not be saved.' });
    }
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Painless Onboarding
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Add a Tesla in three taps</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            FleetOS discovers the vehicle from Tesla, decodes the VIN with free NHTSA data, then asks only for financial details like purchase price and loan balance.
          </p>
        </div>
        <button
          type="button"
          onClick={syncAndPrepare}
          disabled={isLoading}
          className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? 'Syncing...' : '1. Sync Tesla'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Discovered Vehicle</p>
          {realVehicles.length > 0 ? (
            <>
              <select
                value={selectedVehicle?.vin || ''}
                onChange={(event) => {
                  setSelectedVin(event.target.value);
                  setDraft(null);
                  setDecodedVin(null);
                }}
                className="mt-3 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
              >
                {realVehicles.map((vehicle) => (
                  <option key={vehicle.vin || vehicle.id} value={vehicle.vin}>
                    {vehicle.name || vehicle.display_name || vehicle.id}
                  </option>
                ))}
              </select>

              <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-sm font-black text-white">{selectedVehicle?.name || selectedVehicle?.display_name || 'Tesla'}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span className="truncate">{showVin ? selectedVehicle?.vin : maskVin(selectedVehicle?.vin)}</span>
                  {canRevealVin(selectedVehicle?.vin) && (
                    <button
                      type="button"
                      onClick={() => setShowVin((current) => !current)}
                      className="shrink-0 text-sky-300 hover:text-sky-200"
                    >
                      {showVin ? 'Hide VIN' : 'Reveal VIN'}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={enrich}
                className="mt-4 w-full rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
              >
                2. Auto-Fill From VIN
              </button>
            </>
          ) : (
            <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Sync Tesla telemetry first. Once Tesla returns the vehicle list, FleetOS can onboard without manual VIN entry.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Review Fields</p>
              <p className="mt-1 text-sm text-slate-400">
                {decodedVin?.model ? `${decodedVin.modelYear} ${decodedVin.make} ${decodedVin.model}` : 'Waiting for VIN enrichment'}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
              Mobile Ready
            </span>
          </div>

          {draft ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Model Year" type="number" value={draft.modelYear} onChange={(value) => updateDraft('modelYear', value)} />
                <Field label="Model" value={draft.model} onChange={(value) => updateDraft('model', value)} />
                <Field label="Color" value={draft.color} onChange={(value) => updateDraft('color', value)} placeholder="Pearl White" />
                <Field label="Tag / Nickname" value={draft.tag} onChange={(value) => updateDraft('tag', value)} />
                <Field label="Year Purchased" type="number" value={draft.purchaseYear} onChange={(value) => updateDraft('purchaseYear', value)} />
                <Field label="Purchase Date" type="date" value={draft.purchaseDate} onChange={(value) => updateDraft('purchaseDate', value)} />
                <Field label="Price Paid" type="number" value={draft.pricePaid} onChange={(value) => updateDraft('pricePaid', value)} />
                <Field label="Loan Balance" type="number" value={draft.currentBalance} onChange={(value) => updateDraft('currentBalance', value)} />
                <Field label="Monthly Payment" type="number" value={draft.monthlyPayment} onChange={(value) => updateDraft('monthlyPayment', value)} />
                <Field label="Registration State" value={draft.registrationState} onChange={(value) => updateDraft('registrationState', value)} />
              </div>
              <button
                type="button"
                onClick={save}
                className="mt-4 w-full rounded-md bg-sky-300 px-4 py-4 text-sm font-black text-slate-950 transition hover:bg-sky-200"
              >
                3. Save Vehicle
              </button>
            </>
          ) : (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
              FleetOS will prefill model year, make, model, and vehicle identity. You only review the ownership and finance fields.
            </div>
          )}
        </div>
      </div>

      {status.message && (
        <p className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
          status.state === 'error'
            ? 'border-rose-300/20 bg-rose-400/10 text-rose-200'
            : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
        }`}
        >
          {status.message}
        </p>
      )}
    </article>
  );
}
