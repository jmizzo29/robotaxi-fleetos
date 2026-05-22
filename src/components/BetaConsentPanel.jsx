import { useState } from 'react';
import {
  acceptTeslaConsent,
  hasBetaAccess,
  hasTeslaConsent,
  verifyBetaInvite,
} from '../services/betaCompliance';

export default function BetaConsentPanel({ compact = false, onAccepted }) {
  const [invite, setInvite] = useState('');
  const [checks, setChecks] = useState({
    telemetry: false,
    location: false,
    beta: false,
  });
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const betaReady = hasBetaAccess();
  const consentReady = hasTeslaConsent();
  const ready = betaReady && consentReady;

  const submitInvite = () => {
    if (verifyBetaInvite(invite)) {
      setMessage('Beta invite accepted.');
      setRevision((current) => current + 1);
      return;
    }
    setMessage('Invite code did not match.');
  };

  const accept = () => {
    if (!checks.telemetry || !checks.location || !checks.beta) {
      setMessage('Please accept all three consent items before connecting Tesla.');
      return;
    }
    acceptTeslaConsent();
    setMessage('Tesla telemetry consent saved.');
    setRevision((current) => current + 1);
    onAccepted?.();
  };

  return (
    <article className={`rounded-lg border ${ready ? 'border-emerald-300/20 bg-emerald-400/10' : 'border-amber-300/20 bg-amber-400/10'} p-4`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Beta Access & Consent</p>
          <h3 className="mt-2 text-xl font-black text-white">{ready ? 'Ready to Connect Tesla' : 'Required Before Tesla Sync'}</h3>
          {!compact && (
            <p className="mt-2 text-sm leading-6 text-slate-300">
              FleetOS processes VIN, precise location, battery, odometer, charging, and vehicle state. Beta users must explicitly consent before Tesla telemetry sync.
            </p>
          )}
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-black uppercase text-slate-200">
          {ready ? 'Accepted' : 'Action Needed'}
        </span>
      </div>

      {!betaReady && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            placeholder="Beta invite code"
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
          />
          <button
            type="button"
            onClick={submitInvite}
            className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100"
          >
            Unlock Beta
          </button>
        </div>
      )}

      {betaReady && !consentReady && (
        <div className="mt-4 space-y-3">
          {[
            ['telemetry', 'I authorize FleetOS to access my Tesla telemetry for dashboard, finance, location, and owner intelligence features.'],
            ['location', 'I understand FleetOS may process precise vehicle location and parking history.'],
            ['beta', 'I understand this is beta software and should not be used for emergency, safety, or autonomous-driving decisions.'],
          ].map(([key, label]) => (
            <label key={key} className="flex gap-3 rounded-md border border-white/10 bg-slate-950/50 p-3 text-sm leading-5 text-slate-200">
              <input
                type="checkbox"
                checked={checks[key]}
                onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))}
                className="mt-1"
              />
              <span>{label}</span>
            </label>
          ))}
          <button
            type="button"
            onClick={accept}
            className="w-full rounded-md bg-sky-300 px-4 py-3 text-sm font-black text-slate-950"
          >
            Accept Consent
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm font-semibold text-amber-100">{message}</p>}
      <span className="hidden">{revision}</span>
    </article>
  );
}
