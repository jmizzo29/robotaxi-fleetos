export default function Metric({ label, value, hint, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'text-[#F3F3F1]',
    success: 'text-status-ready',
    warning: 'text-status-caution',
    critical: 'text-status-critical',
    info: 'text-status-active',
  };

  return (
    <div className="min-w-0 border-t border-white/[0.08] py-3 first:border-t-0 sm:border-t-0 sm:border-l sm:border-white/[0.08] sm:px-4 sm:py-0 sm:first:border-l-0">
      {Icon && (
        <div className="mb-2 flex h-8 w-8 items-center justify-center text-[#8B8E94]">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-[#8B8E94]">{label}</p>
      <p className={`mt-1 truncate text-[1.65rem] font-medium tracking-[-0.03em] sm:text-[2rem] ${tones[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-[#5C5F66] sm:text-xs">{hint}</p>}
    </div>
  );
}
