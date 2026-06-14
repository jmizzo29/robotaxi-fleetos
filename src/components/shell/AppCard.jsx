import { card, spacing, radius } from '../../design/roboagentTokens';

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
      className={`relative overflow-hidden ${radius.cardLg} border border-white/25 ${spacing.cardPad} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 48%, #7c3aed 100%)',
        boxShadow: '0 24px 56px -24px rgba(37,99,235,0.72)',
      }}
    >
      {children}
    </div>
  );
}
