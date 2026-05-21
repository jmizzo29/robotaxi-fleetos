export default function SettingsPanel({
  realSyncStatus,
  isLoadingReal,
  onSync,
  aiAnalysis,
  replayMode,
  setReplayMode,
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Tesla Integration
        </p>
        <h2 className="text-2xl font-black tracking-tight">Telemetry Sync</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-slate-100">{realSyncStatus?.state || 'idle'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Last Message</span>
            <span className="max-w-[60%] text-right font-bold text-slate-100">{realSyncStatus?.message || 'Unavailable'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={isLoadingReal}
          className="mt-5 w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoadingReal ? 'Syncing Tesla...' : 'Sync Tesla Telemetry'}
        </button>
      </article>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
          AI Runtime
        </p>
        <h2 className="text-2xl font-black tracking-tight">Agent Configuration</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Provider</span>
            <span className="font-bold text-slate-100">{aiAnalysis?.provider || 'pending'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Model</span>
            <span className="font-bold text-slate-100">{aiAnalysis?.model || 'pending'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Replay Engine</span>
            <button
              type="button"
              onClick={() => setReplayMode(!replayMode)}
              className={`rounded-md px-3 py-1 text-xs font-black ${replayMode ? 'bg-sky-300 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
            >
              {replayMode ? 'ACTIVE' : 'OFFLINE'}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
