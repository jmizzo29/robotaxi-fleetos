export default function Chip({ children, active = false, onClick, className = '' }) {
  const base = 'rounded-full px-3 py-1.5 text-xs font-medium transition';
  const styles = active
    ? 'bg-accent text-white'
    : 'border border-ink/10 bg-surface-raised text-ink-muted hover:border-ink/15 hover:text-ink';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${styles} ${className}`}>
        {children}
      </button>
    );
  }

  return <span className={`${base} ${styles} ${className}`}>{children}</span>;
}
