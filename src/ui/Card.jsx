export default function Card({
  children,
  className = '',
  padding = 'p-6',
  interactive = false,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`rounded-3xl border border-ink/8 bg-white shadow-[0_1px_0_0_rgba(20,27,39,0.04)] transition ${
        interactive ? 'hover:border-ink/10 active:scale-[0.997]' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
