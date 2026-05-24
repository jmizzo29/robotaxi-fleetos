const severityStyles = {
  CRITICAL: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
  WARNING: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  INFO: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
};

export default function IntelligentAlertCenter({ analysis, isAnalyzing }) {
  const alerts = analysis?.alerts || [];

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:mb-8 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            AI Alert Triage
          </p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Intelligent Alert Center</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            {analysis?.summary || 'RoboAgent AI is ranking active operating risks.'}
          </p>
        </div>

        <div className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300">
          {isAnalyzing ? 'Analyzing...' : `${analysis?.provider || 'AI'} - ${analysis?.model || 'model pending'}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {alerts.length === 0 && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
            <p className="font-bold">No AI-prioritized alerts.</p>
            <p className="mt-1 text-sm text-emerald-100/80">
              RoboAgent has not detected a high-priority operating risk in the current snapshot.
            </p>
          </div>
        )}

        {alerts.map((alert) => (
          <article
            key={alert.id || `${alert.vehicle}-${alert.title}`}
            className={`rounded-lg border p-4 ${severityStyles[alert.severity] || severityStyles.INFO}`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                  {alert.severity || 'INFO'} - {alert.vehicle || 'Fleet'}
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-50">{alert.title}</h3>
              </div>
              <span className="rounded-md bg-black/20 px-2 py-1 text-xs font-black">
                {Math.round(alert.priorityScore || 0)}
              </span>
            </div>

            <p className="text-sm text-slate-200">{alert.explanation}</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-sm font-semibold text-slate-100">
              {alert.recommendedAction}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
