// src/components/Timeline.jsx
export default function Timeline({ timelineEvents = [] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
      <h2 className="mb-6 text-2xl font-black tracking-tight">Operations Timeline</h2>

      <div className="space-y-3 max-h-[360px] overflow-y-auto">
        {timelineEvents.length > 0 ? (
          timelineEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-4 rounded-lg border border-white/5 bg-slate-950/50 p-4">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400"></div>
              <div>
                <p className="text-slate-300">{event.message || 'System event'}</p>
                <p className="text-xs text-slate-500 mt-1">{event.time || 'Just now'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-slate-500 py-12 text-center">
            No incidents yet. Fleet is running smoothly.
          </div>
        )}
      </div>
    </div>
  );
}
