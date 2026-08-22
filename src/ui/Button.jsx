const variants = {
  primary: 'bg-white text-[#0E0F12] hover:bg-white/90',
  secondary: 'border border-white/12 bg-transparent text-[#F3F3F1] hover:bg-white/5',
  ghost: 'text-[#8B8E94] hover:bg-white/5 hover:text-[#F3F3F1]',
  danger: 'bg-status-critical/10 text-status-critical border border-status-critical/20 hover:bg-status-critical/15',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-full',
  md: 'px-4 py-2.5 text-sm rounded-full',
  lg: 'px-5 py-3.5 text-base rounded-full',
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
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
