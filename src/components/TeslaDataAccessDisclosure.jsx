const dataRows = [
  ['Vehicle Status', 'Battery level, charging state, range, and online state', 'Charging optimization, readiness alerts, and fleet monitoring', 'Sync or streaming when available'],
  ['Location', 'Precise GPS location and parking context', 'Fleet map, utilization history, pickup planning, and owner intelligence', 'Sync or streaming when permission is granted'],
  ['Odometer & Trips', 'Mileage, trip context, and historical movement snapshots', 'Maintenance intervals, earnings estimates, and utilization analysis', 'After telemetry syncs'],
  ['Tire Pressure & Health', 'TPMS, battery, service, and health-related vehicle signals when Tesla provides them', 'Predictive maintenance, safety reminders, and downtime prevention', 'Sync or streaming when available'],
  ['Software & Alerts', 'Software version, vehicle alerts, service mode, and update status', 'Proactive recommendations and owner readiness checks', 'After telemetry syncs'],
  ['Fleet Telemetry', 'Available telemetry fields from connected vehicles', 'AI agent intelligence, charging plans, pricing context, and operational memory', 'Streaming if enabled, otherwise cached syncs'],
];

export default function TeslaDataAccessDisclosure({ compact = false, tone = 'dark' }) {
  const light = tone === 'light';

  return (
    <section className={`rounded-xl border ${
      light ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/80'
    } ${compact ? 'p-4' : 'p-5 shadow-lg shadow-black/10'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.22em] ${light ? 'text-sky-700' : 'text-sky-300'}`}>
            What Data Does ROBOAGENT Access?
          </p>
          <h2 className={`${compact ? 'mt-2 text-xl' : 'mt-3 text-3xl'} font-black tracking-tight ${light ? 'text-slate-950' : 'text-white'}`}>
            Minimum data for useful AI fleet operations.
          </h2>
          <p className={`mt-3 max-w-3xl text-sm leading-6 ${light ? 'text-slate-600' : 'text-slate-400'}`}>
            ROBOAGENT only requests data needed for AI agent features, fleet monitoring, predictive maintenance, charging advice, location intelligence, and earnings optimization.
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase ${
          light ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
        }`}>
          Owner controlled
        </span>
      </div>

      <div className={`mt-5 overflow-hidden rounded-xl border ${light ? 'border-slate-200' : 'border-white/10'}`}>
        <div className={`hidden grid-cols-[0.8fr_1.2fr_1.2fr_0.8fr] text-[11px] font-black uppercase tracking-[0.14em] md:grid ${
          light ? 'bg-slate-50 text-slate-500' : 'bg-slate-950/80 text-slate-500'
        }`}>
          <div className="p-3">Category</div>
          <div className="p-3">Details</div>
          <div className="p-3">Why We Need It</div>
          <div className="p-3">Frequency</div>
        </div>
        {dataRows.map(([category, details, reason, frequency]) => (
          <article key={category} className={`grid gap-2 border-t p-3 text-sm md:grid-cols-[0.8fr_1.2fr_1.2fr_0.8fr] md:gap-0 ${
            light ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-950/45'
          }`}>
            <p className={`font-black ${light ? 'text-slate-950' : 'text-white'}`}>{category}</p>
            <p className={`leading-6 ${light ? 'text-slate-600' : 'text-slate-400'}`}>{details}</p>
            <p className={`leading-6 ${light ? 'text-slate-600' : 'text-slate-400'}`}>{reason}</p>
            <p className={`font-semibold leading-6 ${light ? 'text-slate-700' : 'text-slate-300'}`}>{frequency}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {[
          'You stay in full control and can revoke access.',
          'ROBOAGENT only reads vehicles you explicitly connect.',
          'Sensitive tokens are encrypted server-side.',
          'ROBOAGENT does not sell Tesla telemetry.',
        ].map((note) => (
          <div key={note} className={`rounded-xl border px-3 py-2 text-xs font-bold leading-5 ${
            light ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-100'
          }`}>
            {note}
          </div>
        ))}
      </div>
    </section>
  );
}
