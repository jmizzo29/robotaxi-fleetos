const tones = {
  ready: 'bg-status-ready',
  caution: 'bg-status-caution',
  critical: 'bg-status-critical',
  offline: 'bg-ink-subtle',
  active: 'bg-status-active',
};

export default function StatusDot({ tone = 'ready', pulse = false, className = '' }) {
  return (
    <span className={`relative inline-flex h-2 w-2 shrink-0 ${className}`}>
      {pulse && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${tones[tone]}`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${tones[tone]}`} />
    </span>
  );
}
