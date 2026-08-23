import { card, spacing, radius, colors } from '../../design/roboagentTokens';

const variants = {
  standard: card.base,
  metric: `${card.base} ${spacing.cardPadLg} text-left`,
  alert: `${card.base} ${card.accent} ${spacing.cardPad} ${card.subdued}`,
  subdued: `${card.base} ${card.subdued}`,
};

export default function AppCard({
  variant = 'standard',
  as: Tag = 'div',
  className = '',
  padding = spacing.cardPad,
  children,
  ...props
}) {
  const pad = variant === 'metric' ? '' : padding;

  return (
    <Tag
      className={`${variants[variant]} ${pad} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function HeroCardFrame({ className = '', children }) {
  return (
    <div
      className={`relative overflow-hidden ${radius.cardLg} border border-white/[0.08] ${spacing.cardPad} ${className}`}
      style={{
        background: colors.earningsGradient,
      }}
    >
      {children}
    </div>
  );
}
