export default function Card({
  children,
  className = '',
  padding = 'p-4 sm:p-5',
  interactive = false,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`rounded-2xl border border-ink/10 bg-surface-raised/90 shadow-sm shadow-ink/5 backdrop-blur-sm transition ${
        interactive ? 'hover:border-ink/15 hover:shadow-md active:scale-[0.995]' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
