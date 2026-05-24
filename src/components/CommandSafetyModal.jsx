function classifyCommand(command = '', priority = 'NORMAL') {
  const text = `${command} ${priority}`.toLowerCase();

  if (text.includes('wake') || text.includes('tesla') || text.includes('charge') || text.includes('dispatch')) {
    return {
      level: 'Tesla Dependent',
      tone: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
      detail: 'This may depend on Tesla API support, vehicle state, permissions, or future autonomous capabilities.',
    };
  }

  if (text.includes('critical') || text.includes('high') || text.includes('review')) {
    return {
      level: 'Operator Review',
      tone: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
      detail: 'This creates an audited workflow item for the operator or AI layer to evaluate.',
    };
  }

  return {
    level: 'Safe Queue',
    tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    detail: 'This queues a non-destructive workflow item and records it in RoboAgent memory.',
  };
}

export default function CommandSafetyModal({ pendingCommand, onCancel, onConfirm }) {
  if (!pendingCommand) return null;

  const risk = classifyCommand(pendingCommand.command, pendingCommand.priority);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="border-b border-white/10 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Command Safety
          </p>
          <h2 className="text-2xl font-black tracking-tight text-white">Confirm Operator Action</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            RoboAgent will queue this command, write it to the audit trail, and keep Tesla execution boundaries explicit.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className={`rounded-lg border p-4 ${risk.tone}`}>
            <p className="text-[11px] font-black uppercase tracking-[0.16em]">{risk.level}</p>
            <p className="mt-2 text-sm leading-6">{risk.detail}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Command
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-100">{pendingCommand.command}</p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Priority: {pendingCommand.priority || 'NORMAL'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Confirm & Queue
          </button>
        </div>
      </section>
    </div>
  );
}
