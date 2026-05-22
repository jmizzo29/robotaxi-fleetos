import { useEffect, useState } from 'react';
import { getBetaAdminSummary } from '../services/betaAdminService';

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-sky-300">{value}</p>
    </div>
  );
}

export default function BetaAdminPanel() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('Loading beta admin...');

  const refresh = async () => {
    setMessage('Loading beta admin...');
    try {
      setSummary(await getBetaAdminSummary());
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Admin summary unavailable.');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="space-y-4">
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
            <Metric label="Storage" value={summary.postgres ? 'Postgres' : 'Memory'} />
            <Metric label="Feedback" value={summary.feedbackCount || 0} />
            <Metric label="Leads" value={summary.leadCount ?? 'n/a'} />
            <Metric label="Revenue Records" value={summary.revenueRecordCount ?? 'n/a'} />
            <Metric label="Memory Events" value={summary.memoryEventCount ?? 'n/a'} />
          </div>

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
        </>
      )}
    </section>
  );
}
