function Metric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function formatTime(value) {
  if (!value) return 'Unavailable';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OperationsReportPanel({
  fleet = [],
  analysis,
  commandQueue = [],
  realSyncStatus,
}) {
  const realCount = fleet.filter((vehicle) => vehicle.isReal).length;
  const simCount = fleet.length - realCount;
  const avgBattery = fleet.length
    ? Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.battery || 0), 0) / fleet.length)
    : 0;
  const criticalAlerts = (analysis?.alerts || []).filter((alert) => alert.severity === 'CRITICAL').length;
  const avgConfidence = (analysis?.recommendations || []).length
    ? Math.round(analysis.recommendations.reduce((sum, item) => sum + (item.confidence || 0), 0) / analysis.recommendations.length)
    : 0;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Fleet Size" value={fleet.length} tone="text-sky-300" />
        <Metric label="Real Tesla" value={realCount} tone="text-emerald-300" />
        <Metric label="Simulation" value={simCount} />
        <Metric label="Avg Battery" value={`${avgBattery}%`} tone={avgBattery < 35 ? 'text-amber-300' : 'text-emerald-300'} />
        <Metric label="Critical Alerts" value={criticalAlerts} tone={criticalAlerts ? 'text-rose-300' : 'text-slate-100'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Executive Summary
          </p>
          <h2 className="text-2xl font-black tracking-tight">AI Operating Report</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {analysis?.summary || 'ROBOAGENT AI has not generated a report yet.'}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="AI Provider" value={analysis?.provider || 'pending'} tone="text-sky-300" />
            <Metric label="Avg Confidence" value={`${avgConfidence}%`} tone="text-emerald-300" />
            <Metric label="Generated" value={formatTime(analysis?.generatedAt)} />
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Telemetry Audit
          </p>
          <h2 className="text-2xl font-black tracking-tight">Tesla Sync</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">State</span>
              <span className="font-bold text-slate-100">{realSyncStatus?.state || 'idle'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Last Sync</span>
              <span className="font-bold text-slate-100">{formatTime(realSyncStatus?.lastSyncedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Message</span>
              <span className="max-w-[60%] text-right font-bold text-slate-100">{realSyncStatus?.message || 'Unavailable'}</span>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Command History
            </p>
            <h2 className="text-2xl font-black tracking-tight">Recent Operator Queue</h2>
          </div>
          <span className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300">
            {commandQueue.length} items
          </span>
        </div>

        <div className="space-y-3">
          {commandQueue.map((command, index) => (
            <div key={`${command.command}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{command.priority || 'NORMAL'}</p>
              <p className="mt-1 text-sm font-bold text-slate-100">{command.command}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
