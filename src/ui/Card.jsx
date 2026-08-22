import { card, spacing } from '../design/roboagentTokens';

export default function Card({
  children,
  className = '',
  padding = spacing.cardPad,
  interactive = false,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`${card.base} transition ${
        interactive ? 'active:scale-[0.99] hover:border-white/16' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
