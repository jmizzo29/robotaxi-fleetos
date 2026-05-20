// src/components/Timeline.jsx
export default function Timeline({ timelineEvents = [] }) {
  return (
    <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] p-6">
      <h2 className="text-3xl font-black mb-6">Live Incident Timeline</h2>

      <div className="space-y-3 max-h-[360px] overflow-y-auto">
        {timelineEvents.length > 0 ? (
          timelineEvents.map((event, index) => (
            <div key={index} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-start gap-4">
              <div className="mt-1 h-3 w-3 rounded-full bg-cyan-400 shrink-0"></div>
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