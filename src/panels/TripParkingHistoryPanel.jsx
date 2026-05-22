import { useEffect, useMemo, useState } from 'react';
import { getLocationHistory, summarizeLocationHistory } from '../services/locationHistory';

function formatTime(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDistance(miles) {
  if (!Number.isFinite(Number(miles))) return 'Unavailable';
  if (Number(miles) < 0.1) return `${Math.round(Number(miles) * 5280)} ft`;
  return `${Number(miles).toFixed(2)} mi`;
}

function HistoryRow({ record }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-100">{formatTime(record.timestamp)}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-emerald-300">{Math.round(record.battery || 0)}%</p>
        <p className="mt-1 text-xs text-slate-500">{record.movedFeet || 0} ft moved</p>
      </div>
    </div>
  );
}

export default function TripParkingHistoryPanel({ vehicle }) {
  const [records, setRecords] = useState(() => getLocationHistory(vehicle));

  useEffect(() => {
    const refresh = () => setRecords(getLocationHistory(vehicle));
    refresh();
    window.addEventListener('fleetos-location-history-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('fleetos-location-history-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [vehicle]);

  const summary = useMemo(() => summarizeLocationHistory(records), [records]);

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Trip & Parking History
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">Location Timeline</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            FleetOS records snapshots after each Tesla sync so you can spot movement, parking changes, and charging context.
          </p>
        </div>
        <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black uppercase text-violet-200">
          {summary.snapshotCount} syncs
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last Seen</p>
          <p className="mt-2 truncate text-sm font-black text-slate-100">{formatTime(summary.latest?.timestamp)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last Moved</p>
          <p className="mt-2 truncate text-sm font-black text-slate-100">{formatTime(summary.lastMoved?.timestamp)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tracked</p>
          <p className="mt-2 truncate text-sm font-black text-emerald-300">{formatDistance(summary.totalMiles)}</p>
        </div>
      </div>

      <div className="mt-4 max-h-[320px] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/40 px-4">
        {records.length > 0 ? (
          records.slice(0, 8).map((record) => (
            <HistoryRow key={record.id} record={record} />
          ))
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            Sync Tesla telemetry to start building location history.
          </div>
        )}
      </div>
    </article>
  );
}
