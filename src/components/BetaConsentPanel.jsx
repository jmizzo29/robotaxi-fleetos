import { useState } from 'react';
import {
  acceptTeslaConsent,
  hasBetaAccess,
  hasTeslaConsent,
  verifyBetaInvite,
} from '../services/betaCompliance';
import TeslaIndependenceNotice from './TeslaIndependenceNotice';
import TeslaDataAccessDisclosure from './TeslaDataAccessDisclosure';

export default function BetaConsentPanel({ compact = false, tone = 'dark', onAccepted }) {
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
  const light = tone === 'light';

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
    <article className={`rounded-2xl border ${
      light
        ? ready
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
        : ready
          ? 'border-emerald-300/20 bg-emerald-400/10'
          : 'border-amber-300/20 bg-amber-400/10'
    } p-4`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${light ? 'text-amber-700' : 'text-amber-200'}`}>Beta Access & Consent</p>
          <h3 className={`mt-2 text-xl font-black ${light ? 'text-slate-950' : 'text-white'}`}>{ready ? 'Ready to Connect Tesla' : 'Required Before Tesla Sync'}</h3>
          {!compact && (
            <p className={`mt-2 text-sm leading-6 ${light ? 'text-slate-600' : 'text-slate-300'}`}>
              ROBOAGENT processes VIN, precise location, battery, odometer, charging, and vehicle state. Beta users must explicitly consent before Tesla telemetry sync.
            </p>
          )}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
          light ? 'border-slate-200 bg-white text-slate-700' : 'border-white/10 bg-slate-950/60 text-slate-200'
        }`}>
          {ready ? 'Accepted' : 'Action Needed'}
        </span>
      </div>

      {!betaReady && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            placeholder="Beta invite code"
            className={`rounded-xl border px-3 py-3 text-sm font-bold outline-none ${
              light
                ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-400'
                : 'border-white/10 bg-slate-950 text-white'
            }`}
          />
          <button
            type="button"
            onClick={submitInvite}
            className={`rounded-xl border px-4 py-3 text-sm font-bold ${
              light ? 'border-sky-200 bg-sky-100 text-sky-950' : 'border-sky-400/30 bg-sky-400/10 text-sky-100'
            }`}
          >
            Unlock Beta
          </button>
        </div>
      )}

      {betaReady && !consentReady && (
        <div className="mt-4 space-y-3">
          <TeslaIndependenceNotice compact tone={tone} />
          <TeslaDataAccessDisclosure compact tone={tone} />
          {[
            ['telemetry', 'I authorize ROBOAGENT to access my Tesla telemetry for dashboard, finance, location, and owner intelligence features.'],
            ['location', 'I understand ROBOAGENT may process precise vehicle location and parking history.'],
            ['beta', 'I understand this is beta software and should not be used for emergency, safety, or autonomous-driving decisions.'],
          ].map(([key, label]) => (
            <label key={key} className={`flex gap-3 rounded-xl border p-3 text-sm leading-5 ${
              light ? 'border-slate-200 bg-white text-slate-700' : 'border-white/10 bg-slate-950/50 text-slate-200'
            }`}>
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
            className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600"
          >
            Accept Consent
          </button>
        </div>
      )}

      {message && <p className={`mt-3 text-sm font-semibold ${light ? 'text-amber-800' : 'text-amber-100'}`}>{message}</p>}
      <span className="hidden">{revision}</span>
    </article>
  );
}
