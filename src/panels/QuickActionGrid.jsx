const actions = [
  {
    label: 'Sync Tesla',
    detail: 'Refresh live telemetry',
    command: null,
    tone: 'emerald',
    icon: 'M12 3a9 9 0 0 1 8.5 6h-3A6.5 6.5 0 1 0 18 15l2.1 2.1A9 9 0 1 1 12 3Zm0 4v5l4 2',
  },
  {
    label: 'Rebalance',
    detail: 'Protect demand corridors',
    command: 'Rebalance Orlando corridor fleet capacity',
    tone: 'sky',
    icon: 'M4 7h11l-3-3m3 3-3 3M20 17H9l3 3m-3-3 3-3',
  },
  {
    label: 'Charge Plan',
    detail: 'Optimize charging windows',
    command: 'Charging Optimization Triggered',
    tone: 'amber',
    icon: 'M13 2 5 13h6l-1 9 8-12h-6l1-8Z',
  },
  {
    label: 'AI Review',
    detail: 'Queue operator analysis',
    command: 'AI operator review requested',
    tone: 'violet',
    icon: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Z',
  },
];

const tones = {
  emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  sky: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
};

export default function QuickActionGrid({ onSync, onExecute, isLoading }) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 xl:grid-cols-4">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => (action.command ? onExecute(action.command, 'AI') : onSync())}
          disabled={!action.command && isLoading}
          className={`flex min-h-[84px] items-center gap-3 rounded-lg border p-3 text-left shadow-lg shadow-black/10 transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60 ${tones[action.tone]}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d={action.icon} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-50">{!action.command && isLoading ? 'Syncing' : action.label}</span>
            <span className="mt-1 block text-xs text-slate-400">{action.detail}</span>
          </span>
        </button>
      ))}
    </section>
  );
}
