export default function TeslaIndependenceNotice({ compact = false, tone = 'dark' }) {
  const light = tone === 'light';

  return (
    <div className={`rounded-xl border ${
      light ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-950/55'
    } ${compact ? 'p-3' : 'p-4'}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${light ? 'text-slate-500' : 'text-slate-500'}`}>
        Independent Tesla Integration
      </p>
      <p className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} leading-6 ${light ? 'text-slate-600' : 'text-slate-400'}`}>
        RoboAgent is not affiliated with, endorsed by, or sponsored by Tesla. Tesla controls vehicle access,
        API availability, command execution, and autonomous driving eligibility.
      </p>
    </div>
  );
}
