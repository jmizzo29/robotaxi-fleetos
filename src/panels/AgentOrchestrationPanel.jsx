const agents = [
  {
    name: 'Orchestrator',
    role: 'Merges telemetry, simulation, alerts, and recommendations into one operating picture.',
    signal: 'Primary',
    tone: 'emerald',
  },
  {
    name: 'Telemetry Agent',
    role: 'Watches Tesla sync freshness, battery, charging, GPS, and online state.',
    signal: 'Live',
    tone: 'sky',
  },
  {
    name: 'Alert Agent',
    role: 'Ranks risks by severity, operational impact, and explainability.',
    signal: 'Triage',
    tone: 'rose',
  },
  {
    name: 'Dispatch Agent',
    role: 'Finds rebalance opportunities across demand corridors and vehicle readiness.',
    signal: 'Routing',
    tone: 'violet',
  },
  {
    name: 'Charging Agent',
    role: 'Optimizes energy windows using battery state, weather, electricity-rate windows, and availability.',
    signal: 'Energy',
    tone: 'amber',
  },
  {
    name: 'Pricing Agent',
    role: 'Reviews Turo earnings, utilization, local events, holidays, and demand signals to suggest price changes.',
    signal: 'Pricing',
    tone: 'cyan',
  },
  {
    name: 'Traffic Agent',
    role: 'Watches traffic and incident context that can affect pickups, cleaning windows, and utilization.',
    signal: 'Roads',
    tone: 'orange',
  },
  {
    name: 'Opportunity Agent',
    role: 'Finds event-driven staging and pricing opportunities around concerts, sports games, holidays, and airport demand.',
    signal: 'Events',
    tone: 'lime',
  },
];

const tones = {
  emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  sky: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  rose: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  orange: 'border-orange-400/20 bg-orange-400/10 text-orange-200',
  lime: 'border-lime-400/20 bg-lime-400/10 text-lime-200',
};

function formatTime(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AgentOrchestrationPanel({
  analysis,
  isAnalyzing,
  realVehicleCount = 0,
  commandCount = 0,
}) {
  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:mb-8 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            AI Operating Layer
          </p>
          <h2 className="text-2xl font-black tracking-tight">Agent Orchestration</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            RoboAgent coordinates specialized agents around live Tesla telemetry, simulation, alerts, and operator commands.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Provider</p>
            <p className="mt-1 truncate text-xs font-black text-slate-100">{analysis?.provider || 'pending'}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tesla</p>
            <p className="mt-1 text-xs font-black text-emerald-300">{realVehicleCount}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Commands</p>
            <p className="mt-1 text-xs font-black text-sky-300">{commandCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent, index) => (
          <article key={agent.name} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${tones[agent.tone]}`}>
                {agent.signal}
              </span>
              <span className="text-xs font-black text-slate-500">0{index + 1}</span>
            </div>
            <h3 className="text-base font-black text-slate-50">{agent.name}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">{agent.role}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-300">
            {isAnalyzing ? 'Agents are analyzing the latest fleet snapshot...' : analysis?.summary || 'Agent summary pending.'}
          </p>
          <span className="shrink-0 rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-400">
            Updated {formatTime(analysis?.generatedAt)}
          </span>
        </div>
      </div>
    </section>
  );
}
