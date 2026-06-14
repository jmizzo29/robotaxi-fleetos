import { useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import { deleteUserData, revokeTeslaConsent } from '../services/betaCompliance';
import { disconnectTeslaForUser } from '../services/sessionService';
import { AppCard } from '../components/shell';
import { colors, semantic, typography } from '../design/roboagentTokens';

export default function DataPrivacyPanel() {
  const [message, setMessage] = useState('');

  const deleteData = async () => {
    const confirmed = window.confirm('Delete ROBOAGENT backend memory/assets/revenue records and local consent state? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteUserData();
      setMessage('ROBOAGENT beta data, Tesla connection, fleet records, and local consent state were deleted.');
    } catch (error) {
      setMessage(error.message || 'ROBOAGENT data deletion failed.');
    }
  };

  const revoke = async () => {
    try {
      const result = await disconnectTeslaForUser();
      await revokeTeslaConsent();
      setMessage(result.message || 'Connection removed. Also revoke ROBOAGENT from Tesla third-party app access controls.');
    } catch (error) {
      setMessage(error.message || 'Unable to remove the Tesla connection. Try again.');
    }
  };

  return (
    <AppCard>
      <p className={typography.label}>Privacy Controls</p>
      <h2 className={`mt-1 ${typography.cardTitle}`}>Beta Data & Consent</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        Use these controls before bringing in beta testers. They make consent explicit and give users a simple path to delete ROBOAGENT data.
      </p>

      <div className="mt-5">
        <BetaConsentPanel />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={revoke}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
        >
          Revoke ROBOAGENT Consent
        </button>
        <button
          type="button"
          onClick={deleteData}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100"
        >
          Delete My Data
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
        To fully disconnect, the beta user should also remove ROBOAGENT from Tesla third-party app access in their Tesla account/app.
      </div>

      {message && (
        <p className="mt-3 text-sm font-semibold" style={{ color: semantic.positive }}>{message}</p>
      )}
    </AppCard>
  );
}
