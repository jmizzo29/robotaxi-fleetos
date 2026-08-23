export default function Chip({ children, active = false, onClick, className = '' }) {
  const base = 'rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition';
  const styles = active
    ? 'bg-white text-[#0E0F12]'
    : 'border border-white/10 bg-transparent text-[#C4C6CB] hover:border-white/18 hover:text-[#F3F3F1]';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${styles} ${className}`}>
        {children}
      </button>
    );
  }

  return <span className={`${base} ${styles} ${className}`}>{children}</span>;
}
