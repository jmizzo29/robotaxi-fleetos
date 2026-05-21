import { useEffect, useMemo, useState } from 'react';
import { clearFleetMemory, exportFleetMemory, readFleetMemory, syncFleetMemoryFromBackend } from '../services/fleetMemory';

function formatTime(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildMemoryEvents({ fleet = [], analysis, commandQueue = [], realSyncStatus }) {
  const realVehicles = fleet.filter((vehicle) => vehicle.isReal);
  const alerts = analysis?.alerts || [];
  const recommendations = analysis?.recommendations || [];

  return [
    ...realVehicles.map((vehicle) => ({
      type: 'Telemetry',
      title: `${vehicle.name || vehicle.display_name || vehicle.id} telemetry synced`,
      detail: `${vehicle.status || vehicle.state || 'Online'} with ${Math.round(vehicle.battery || 0)}% battery and ${vehicle.chargingState || 'unknown charge state'}.`,
      timestamp: vehicle.syncedAt || realSyncStatus?.lastSyncedAt,
      source: 'Tesla Fleet API',
      ragReady: true,
    })),
    ...alerts.slice(0, 4).map((alert) => ({
      type: 'Alert',
      title: alert.title,
      detail: alert.explanation,
      timestamp: analysis?.generatedAt,
      source: `AI priority ${Math.round(alert.priorityScore || 0)}`,
      ragReady: true,
    })),
    ...recommendations.slice(0, 4).map((recommendation) => ({
      type: 'Recommendation',
      title: recommendation.title,
      detail: recommendation.rationale,
      timestamp: analysis?.generatedAt,
      source: `${Math.round(recommendation.confidence || 0)}% confidence`,
      ragReady: true,
    })),
    ...commandQueue.map((command) => ({
      type: 'Command',
      title: command.command,
      detail: 'Operator command queued from FleetOS workflow.',
      timestamp: null,
      source: command.priority || 'NORMAL',
      ragReady: false,
    })),
  ];
}

const typeStyles = {
  Telemetry: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  Alert: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  Recommendation: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  Command: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
};

export default function MemoryEventsPanel({ fleet, analysis, commandQueue, realSyncStatus }) {
  const liveEvents = useMemo(
    () => buildMemoryEvents({ fleet, analysis, commandQueue, realSyncStatus }),
    [analysis, commandQueue, fleet, realSyncStatus],
  );
  const [storedEvents, setStoredEvents] = useState(() => readFleetMemory());
  const events = storedEvents.length ? storedEvents : liveEvents;
  const ragReadyCount = events.filter((event) => event.ragReady).length;
  const commandCount = events.filter((event) => event.type === 'Command').length;

  useEffect(() => {
    const handleMemoryUpdated = () => setStoredEvents(readFleetMemory());
    syncFleetMemoryFromBackend().then(setStoredEvents);
    window.addEventListener('fleetos-memory-updated', handleMemoryUpdated);
    window.addEventListener('storage', handleMemoryUpdated);
    return () => {
      window.removeEventListener('fleetos-memory-updated', handleMemoryUpdated);
      window.removeEventListener('storage', handleMemoryUpdated);
    };
  }, []);

  const handleExport = async () => {
    const payload = exportFleetMemory();
    await navigator.clipboard?.writeText(payload);
  };

  const handleClear = () => {
    clearFleetMemory();
    setStoredEvents([]);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Memory Events</p>
          <p className="mt-2 text-2xl font-black text-sky-300">{events.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">RAG Ready</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{ragReadyCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Commands</p>
          <p className="mt-2 text-2xl font-black text-violet-300">{commandCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Storage</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{storedEvents.length ? 'Local' : 'Live'}</p>
        </div>
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Fleet Memory
            </p>
            <h2 className="text-2xl font-black tracking-tight">Events For Future RAG</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              These events are the raw material FleetOS will store, embed, retrieve, and use to explain similar future situations. Syncs and operator commands now persist locally as an audit trail.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-400/20"
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/20"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={`${event.type}-${event.title}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${typeStyles[event.type]}`}>
                    {event.type}
                  </span>
                  <h3 className="mt-3 font-black text-slate-100">{event.title}</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">{formatTime(event.timestamp)}</span>
              </div>
              <p className="text-sm leading-6 text-slate-400">{event.detail}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 font-semibold text-slate-400">
                  {event.source}
                </span>
                <span className={`rounded-md border px-2 py-1 font-semibold ${event.ragReady ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
                  {event.ragReady ? 'RAG candidate' : 'Needs outcome'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
