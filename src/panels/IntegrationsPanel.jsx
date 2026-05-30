import SocialSignalPanel from '../components/SocialSignalPanel';
import TeslaSyncHealthPanel from './TeslaSyncHealthPanel';

const integrations = [
  {
    name: 'Tesla Fleet API',
    status: 'Connected',
    description: 'Live vehicle telemetry, charging state, GPS, odometer, software, and vehicle readiness.',
    signal: 'Production',
    tone: 'emerald',
  },
  {
    name: 'Mapbox',
    status: 'Connected',
    description: 'Dark operational maps, markers, route overlays, demand zones, and charging hubs.',
    signal: 'Map Layer',
    tone: 'sky',
  },
  {
    name: 'AI Provider',
    status: 'Configurable',
    description: 'Claude or Grok analysis endpoint with local heuristic fallback when provider keys are absent.',
    signal: 'Agent Layer',
    tone: 'violet',
  },
  {
    name: 'Fleet Memory / RAG',
    status: 'Planned',
    description: 'Historical fleet events, accepted recommendations, outcomes, and similarity retrieval.',
    signal: 'Roadmap',
    tone: 'amber',
  },
];

const tones = {
  emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  sky: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
};

export default function IntegrationsPanel({
  aiAnalysis,
  realSyncStatus,
  vehicle,
  isLoading,
  onSync,
}) {
  return (
    <section className="space-y-4">
      <TeslaSyncHealthPanel
        vehicle={vehicle}
        realSyncStatus={realSyncStatus}
        isLoading={isLoading}
        onSync={onSync}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {integrations.map((integration) => (
          <article key={integration.name} className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Integration
                </p>
                <h2 className="text-2xl font-black tracking-tight">{integration.name}</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[integration.tone]}`}>
                {integration.status}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-400">{integration.description}</p>
            <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm">
              <span className="text-slate-500">Signal: </span>
              <span className="font-bold text-slate-100">{integration.signal}</span>
            </div>
          </article>
        ))}
      </div>

      <SocialSignalPanel />

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
          Runtime Diagnostics
        </p>
        <h2 className="text-2xl font-black tracking-tight">Current Connected State</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tesla Sync</p>
            <p className="mt-2 text-xl font-black text-emerald-300">{realSyncStatus?.state || 'idle'}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">AI Provider</p>
            <p className="mt-2 text-xl font-black text-sky-300">{aiAnalysis?.provider || 'pending'}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">AI Model</p>
            <p className="mt-2 truncate text-xl font-black text-violet-300">{aiAnalysis?.model || 'pending'}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
