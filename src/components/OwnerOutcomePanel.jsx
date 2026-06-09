export default function OwnerOutcomePanel() {
  const vehicles = [
    ['Model Y - Orlando', 'Ready', '94/100', '$312', 'Charge to 88% tonight'],
    ['Model 3 - Tampa', 'Watch', '81/100', '$188', 'Check tire pressure before pickup'],
  ];
  const agentCapabilities = [
    ['DYNAMIC PRICING', '+18% Orlando weekend'],
    ['DAILY AI PLAN', '3 owner actions ready'],
    ['PREDICTIVE MAINTENANCE', 'Tampa tire watch'],
    ['CHARGING + CLEANING', '11 PM charge window'],
    ['PROFITABILITY INSIGHT', '+$284 projected'],
  ];

  return (
    <aside className="min-h-screen bg-gradient-to-b from-slate-950 to-black p-4 pb-20 text-white md:min-h-0 md:rounded-[2rem] md:p-6 lg:p-8" data-testid="agent-command-center">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-teal-400">ROBOAGENT Command Center</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">The AI agent is the product.</h2>
        </div>
        <span className="shrink-0 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
          Agent active
        </span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {agentCapabilities.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${label === 'PROFITABILITY INSIGHT' ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-3xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-400">7:04 AM AI Plan Ready</p>
        <h2 className="mb-6 text-2xl font-bold leading-tight text-white">
          Raise Orlando pricing, charge after 11 PM, clean before pickup, and fix the Tampa tire-pressure risk.
        </h2>

        <div className="flex gap-4">
          <button type="button" className="flex-1 rounded-2xl bg-white py-4 text-lg font-semibold text-black">
            Approve Plan
          </button>
          <button type="button" className="flex-1 rounded-2xl border border-zinc-600 py-4 text-lg font-medium text-white">
            Ask Follow-up
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {vehicles.map(([name, status, score, revenue, action]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl bg-zinc-900 p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <p className="font-medium text-white">{name}</p>
              </div>
              <p className="mt-1 text-sm text-gray-400">{action}</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${status === 'Ready' ? 'text-emerald-400' : 'text-yellow-400'}`}>{score}</p>
              <p className="text-xs text-gray-500">Readiness</p>
              <p className="mt-1 font-bold text-emerald-400">{revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
