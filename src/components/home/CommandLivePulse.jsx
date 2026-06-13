export default function CommandLivePulse({
  tone = 'live',
  label,
  className = '',
}) {
  const dotClass = tone === 'charge'
    ? 'bg-[#599CE7]'
    : tone === 'warn'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className={`command-live-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${dotClass}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      </span>
      {label && (
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70">{label}</span>
      )}
    </span>
  );
}
