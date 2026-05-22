import { useCallback, useEffect, useState } from 'react';
import { getBetaAdminSummary, hasAdminAccess, verifyAdminCode } from '../services/betaAdminService';

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

export default function BetaAdminPanel() {
  const [unlocked, setUnlocked] = useState(() => hasAdminAccess());
  const [code, setCode] = useState('');
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState(unlocked ? 'Loading beta admin...' : 'Admin code required.');

  const unlock = () => {
    if (verifyAdminCode(code)) {
      setUnlocked(true);
      setMessage('Admin unlocked.');
      return;
    }
    setMessage('Admin code did not match.');
  };

  const refresh = useCallback(async () => {
    if (!unlocked) return;
    setMessage('Loading beta admin...');
    try {
      setSummary(await getBetaAdminSummary());
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Admin summary unavailable.');
    }
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked) return undefined;
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh, unlocked]);

  return (
    <section className="space-y-4">
      {!unlocked && (
        <article className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Restricted</p>
          <h2 className="mt-2 text-2xl font-black text-white">Admin Access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Enter the beta admin invite code to view tester feedback and storage status.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Admin code"
              className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
            />
            <button type="button" onClick={unlock} className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100">
              Unlock
            </button>
          </div>
          {message && <p className="mt-3 text-sm font-semibold text-amber-100">{message}</p>}
        </article>
      )}

      {unlocked && (
      <>
      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Beta Admin</p>
            <h2 className="mt-2 text-3xl font-black text-white">Tester Operations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Track feedback and confirm whether FleetOS is using Postgres or temporary memory storage.
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <Metric label="Storage" value={summary.postgres ? 'Postgres' : 'Memory'} helper={summary.postgres ? 'DATABASE_URL active' : 'Temporary fallback'} />
            <Metric label="Feedback" value={summary.feedbackCount || 0} />
            <Metric label="Leads" value={summary.leadCount ?? 'n/a'} />
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
                    <p className="mt-2 text-xs text-slate-600">{item.route || 'unknown route'} - {item.email || 'anonymous'}</p>
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
