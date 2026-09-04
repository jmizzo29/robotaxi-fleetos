import { useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import { deleteUserData, revokeTeslaConsent } from '../services/betaCompliance';
import { disconnectTeslaForUser } from '../services/sessionService';
import { AppCard } from '../components/shell';
import { semantic, typography } from '../design/roboagentTokens';

const DELETE_PHRASE = 'DELETE';

export default function DataPrivacyPanel() {
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  const deleteData = async () => {
    if (confirmation.trim() !== DELETE_PHRASE) {
      setMessage(`Type ${DELETE_PHRASE} to confirm permanent deletion.`);
      return;
    }

    setBusy(true);
    try {
      await deleteUserData({ confirmation: DELETE_PHRASE });
      setMessage('ROBOAGENT beta data, Tesla connection, fleet records, and local consent state were deleted.');
      setConfirmation('');
    } catch (error) {
      setMessage(error.message || 'ROBOAGENT data deletion failed.');
    } finally {
      setBusy(false);
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
        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Type {DELETE_PHRASE} to delete
          </label>
          <input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold tracking-wide text-slate-800"
            placeholder={DELETE_PHRASE}
          />
          <button
            type="button"
            onClick={deleteData}
            disabled={busy || confirmation.trim() !== DELETE_PHRASE}
            className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete My Data'}
          </button>
        </div>
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
