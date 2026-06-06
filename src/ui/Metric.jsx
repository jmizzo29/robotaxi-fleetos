export default function Metric({ label, value, hint, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'text-ink',
    success: 'text-status-ready',
    warning: 'text-status-caution',
    critical: 'text-status-critical',
    info: 'text-status-active',
  };

  return (
    <div className="min-w-0 rounded-2xl border border-ink/8 bg-surface-raised p-3 sm:p-4">
      {Icon && (
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <p className="truncate text-[11px] font-medium text-ink-muted sm:text-xs">{label}</p>
      <p className={`mt-0.5 truncate text-xl font-semibold tracking-tight sm:text-2xl ${tones[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-ink-subtle sm:text-xs">{hint}</p>}
    </div>
  );
}
