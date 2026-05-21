function formatTime(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommandInboxPanel({ commandQueue = [] }) {
  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:mb-8 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Command Workflow
          </p>
          <h2 className="text-2xl font-black tracking-tight">AI Action Inbox</h2>
        </div>
        <span className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300">
          {commandQueue.length} queued
        </span>
      </div>

      <div className="space-y-3">
        {commandQueue.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
            No active commands. Execute an AI recommendation to create an operator workflow item.
          </div>
        )}

        {commandQueue.map((command, index) => (
          <article key={`${command.command}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {command.priority || 'NORMAL'} - Step {index + 1} - {formatTime(command.timestamp)}
                </p>
                <h3 className="mt-1 font-black text-slate-100">{command.command}</h3>
              </div>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-black uppercase text-sky-200">
                Queued
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
