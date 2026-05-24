export default function TeslaIndependenceNotice({ compact = false }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-slate-950/55 ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        Independent Tesla Integration
      </p>
      <p className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} leading-6 text-slate-400`}>
        RoboAgent is not affiliated with, endorsed by, or sponsored by Tesla. Tesla controls vehicle access,
        API availability, command execution, and autonomous driving eligibility.
      </p>
    </div>
  );
}
