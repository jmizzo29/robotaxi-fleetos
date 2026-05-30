import { useCallback, useEffect, useState } from 'react';
import { getBetaAdminSummary, purgeBetaUser } from '../services/betaAdminService';

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-sky-300">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return '$0';
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function RecoveryPurgeCard({
  email,
  confirmation,
  resetToken,
  message,
  error,
  isPurging,
  onEmailChange,
  onConfirmationChange,
  onResetTokenChange,
  onPurge,
}) {
  return (
    <article className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-5 shadow-lg shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">Beta Recovery</p>
      <h2 className="mt-2 text-2xl font-black text-white">Purge a stuck test account</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-rose-100/80">
        Use this when you need to wipe your own test account and start signup fresh. It requires the server-side ADMIN_RESET_TOKEN value.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-rose-100/70">User email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="owner@example.com"
            className="w-full rounded-2xl border border-rose-300/20 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-rose-100/70">Confirm email</span>
          <input
            type="email"
            value={confirmation}
            onChange={(event) => onConfirmationChange(event.target.value)}
            placeholder="owner@example.com"
            className="w-full rounded-2xl border border-rose-300/20 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-rose-100/70">Admin reset key</span>
          <input
            type="password"
            value={resetToken}
            onChange={(event) => onResetTokenChange(event.target.value)}
            placeholder="ADMIN_RESET_TOKEN"
            className="w-full rounded-2xl border border-rose-300/20 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300"
          />
        </label>
        <button
          type="button"
          onClick={onPurge}
          disabled={
            isPurging ||
            !email ||
            email.toLowerCase() !== confirmation.toLowerCase() ||
            !resetToken
          }
          className="self-end rounded-2xl border border-rose-300/30 bg-rose-400/20 px-5 py-3 text-sm font-black text-rose-50 transition hover:bg-rose-400/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPurging ? 'Purging...' : 'Recovery Purge'}
        </button>
      </div>

      {(message || error) && (
        <div className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${
          error
            ? 'border-red-300/25 bg-red-400/10 text-red-100'
            : 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
        }`}>
          {error || message}
        </div>
      )}
    </article>
  );
}

export default function BetaAdminPanel() {
  const [unlocked, setUnlocked] = useState(true);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('Loading secure admin...');
  const [purgeEmail, setPurgeEmail] = useState('');
  const [purgeConfirmation, setPurgeConfirmation] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryConfirmation, setRecoveryConfirmation] = useState('');
  const [recoveryResetToken, setRecoveryResetToken] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [purgeMessage, setPurgeMessage] = useState('');
  const [purgeError, setPurgeError] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [isRecoveryPurging, setIsRecoveryPurging] = useState(false);

  const refresh = useCallback(async () => {
    setMessage('Loading beta admin...');
    try {
      setSummary(await getBetaAdminSummary());
      setMessage('');
      setUnlocked(true);
    } catch (error) {
      setUnlocked(false);
      setMessage(error.message || 'Admin summary unavailable.');
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return undefined;
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh, unlocked]);

  const purgeUser = async () => {
    setIsPurging(true);
    setPurgeMessage('');
    setPurgeError('');
    try {
      const result = await purgeBetaUser({
        email: purgeEmail,
        confirmation: purgeConfirmation,
      });
      setPurgeMessage(result.message || 'Beta user purge completed.');
      setPurgeEmail('');
      setPurgeConfirmation('');
      await refresh();
    } catch (error) {
      setPurgeError(error.message || 'Beta user purge failed.');
    } finally {
      setIsPurging(false);
    }
  };

  const recoveryPurgeUser = async () => {
    setIsRecoveryPurging(true);
    setRecoveryMessage('');
    setRecoveryError('');
    try {
      const result = await purgeBetaUser({
        email: recoveryEmail,
        confirmation: recoveryConfirmation,
        resetToken: recoveryResetToken,
      });
      setRecoveryMessage(result.message || 'Recovery purge completed.');
      setRecoveryEmail('');
      setRecoveryConfirmation('');
      setRecoveryResetToken('');
    } catch (error) {
      setRecoveryError(error.message || 'Recovery purge failed.');
    } finally {
      setIsRecoveryPurging(false);
    }
  };

  const recoveryCard = (
    <RecoveryPurgeCard
      email={recoveryEmail}
      confirmation={recoveryConfirmation}
      resetToken={recoveryResetToken}
      message={recoveryMessage}
      error={recoveryError}
      isPurging={isRecoveryPurging}
      onEmailChange={setRecoveryEmail}
      onConfirmationChange={setRecoveryConfirmation}
      onResetTokenChange={setRecoveryResetToken}
      onPurge={recoveryPurgeUser}
    />
  );

  return (
    <section className="space-y-4">
      {!unlocked && (
        <>
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4">
              <p className="text-sm font-bold uppercase text-sky-300">ROBOAGENT Admin</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Sign in required</p>
              <h2 className="mt-3 text-4xl font-black text-white">Admin Access</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Sign in with your ROBOAGENT admin account first. Your email must be listed in the server-side ADMIN_EMAILS allowlist.
              </p>
              {message && (
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-semibold text-amber-100">
                  {message}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <a
                  href="#/account"
                  className="rounded-2xl bg-teal-500 px-5 py-4 text-center text-base font-black text-black transition hover:bg-teal-400"
                >
                  Sign In as Admin
                </a>
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base font-black text-white transition hover:bg-white/10"
                >
                  Retry
                </button>
              </div>
            </div>
          </article>

          {recoveryCard}
        </>
      )}

      {unlocked && recoveryCard}

      {unlocked && (
      <>
      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Beta Admin</p>
            <h2 className="mt-2 text-3xl font-black text-white">Tester Operations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Track redacted feedback and confirm whether ROBOAGENT is using Postgres for durable beta storage.
            </p>
          </div>
          <button type="button" onClick={refresh} className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100">
            Refresh
          </button>
        </div>
      </article>

      {message && <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">{message}</div>}

      {summary && (
        <>
          <article className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-5 shadow-lg shadow-black/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">Danger Zone</p>
                <h2 className="mt-2 text-2xl font-black text-white">Purge Beta User</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-rose-100/80">
                  Deletes the ROBOAGENT user, sessions, Tesla token storage, fleet vehicles, telemetry snapshots, revenue, memory, assets, and matching beta lead or feedback rows. If Clerk can be reached, the matching Clerk user is deleted too.
                </p>
              </div>
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-black uppercase text-rose-100">
                Admin Only
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-rose-100/70">User email</span>
                <input
                  type="email"
                  value={purgeEmail}
                  onChange={(event) => setPurgeEmail(event.target.value)}
                  placeholder="owner@example.com"
                  className="w-full rounded-lg border border-rose-300/20 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-rose-100/70">Type email again to confirm</span>
                <input
                  type="email"
                  value={purgeConfirmation}
                  onChange={(event) => setPurgeConfirmation(event.target.value)}
                  placeholder="owner@example.com"
                  className="w-full rounded-lg border border-rose-300/20 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300"
                />
              </label>
              <button
                type="button"
                onClick={purgeUser}
                disabled={isPurging || !purgeEmail || purgeEmail.toLowerCase() !== purgeConfirmation.toLowerCase()}
                className="self-end rounded-lg border border-rose-300/30 bg-rose-400/20 px-5 py-3 text-sm font-black text-rose-50 transition hover:bg-rose-400/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPurging ? 'Purging...' : 'Purge User'}
              </button>
            </div>

            {(purgeMessage || purgeError) && (
              <div className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${
                purgeError
                  ? 'border-red-300/25 bg-red-400/10 text-red-100'
                  : 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
              }`}>
                {purgeError || purgeMessage}
              </div>
            )}
          </article>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric label="Storage" value={summary.postgres ? 'Postgres' : 'Missing DB'} helper={summary.postgres ? 'DATABASE_URL active' : 'Set DATABASE_URL before collecting beta data'} />
            <Metric label="Feedback" value={summary.feedbackCount || 0} />
            <Metric label="Leads" value={summary.leadCount ?? 'n/a'} />
            <Metric label="Vehicles" value={summary.vehicleCount ?? 'n/a'} />
            <Metric label="Telemetry" value={summary.telemetrySnapshotCount ?? 'n/a'} helper="Snapshots stored" />
            <Metric label="Assets" value={summary.assetRecordCount ?? 'n/a'} />
            <Metric label="Memory" value={summary.memoryEventCount ?? 'n/a'} />
            <Metric label="Revenue Records" value={summary.revenueRecordCount ?? 'n/a'} />
            <Metric label="Revenue Total" value={formatCurrency(summary.revenueTotal || 0)} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Latest Feedback</p>
              <div className="space-y-3">
                {(summary.latestFeedback || []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.detail}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
                        {item.type} / {item.rating || 'n/a'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">{item.route || 'unknown route'} - {item.email || 'redacted'}</p>
                  </div>
                ))}
                {(!summary.latestFeedback || summary.latestFeedback.length === 0) && (
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
                    No beta feedback yet.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Latest Leads</p>
              <div className="space-y-3">
                {(summary.latestLeads || []).map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                    <p className="font-black text-white">{lead.name || 'Unnamed lead'}</p>
                    <p className="mt-1 text-sm text-sky-300">{lead.email}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {lead.teslaCount || 'n/a'} Tesla(s) - {lead.useCase || 'unknown use case'} - {lead.plan || 'unknown plan'}
                    </p>
                  </div>
                ))}
                {(!summary.latestLeads || summary.latestLeads.length === 0) && (
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
                    No early access leads yet.
                  </div>
                )}
              </div>
            </article>
          </div>
        </>
      )}
      </>
      )}
    </section>
  );
}
