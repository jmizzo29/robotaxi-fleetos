import { useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import { deleteUserData, revokeTeslaConsent } from '../services/betaCompliance';

export default function DataPrivacyPanel() {
  const [message, setMessage] = useState('');

  const deleteData = async () => {
    const confirmed = window.confirm('Delete RoboAgent backend memory/assets/revenue records and local consent state? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteUserData();
      setMessage('RoboAgent beta data, Tesla connection, fleet records, and local consent state were deleted.');
    } catch (error) {
      setMessage(error.message || 'RoboAgent data deletion failed.');
    }
  };

  const revoke = async () => {
    await revokeTeslaConsent();
    setMessage('RoboAgent Tesla telemetry consent was revoked and the stored Tesla connection was disconnected. Also revoke RoboAgent from Tesla third-party app access controls.');
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
        Privacy Controls
      </p>
      <h2 className="text-2xl font-black tracking-tight">Beta Data & Consent</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Use these controls before bringing in beta testers. They make consent explicit and give users a simple path to delete RoboAgent data.
      </p>

      <div className="mt-5">
        <BetaConsentPanel />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={revoke}
          className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20"
        >
          Revoke RoboAgent Consent
        </button>
        <button
          type="button"
          onClick={deleteData}
          className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20"
        >
          Delete My Data
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
        To fully disconnect, the beta user should also remove RoboAgent from Tesla third-party app access in their Tesla account/app.
      </div>

      {message && <p className="mt-3 text-sm font-semibold text-emerald-300">{message}</p>}
    </article>
  );
}
