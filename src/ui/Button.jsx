const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  secondary: 'border border-ink/12 bg-surface-raised text-ink hover:bg-white',
  ghost: 'text-ink-muted hover:bg-ink/5 hover:text-ink',
  danger: 'bg-status-critical/10 text-status-critical border border-status-critical/20 hover:bg-status-critical/15',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
