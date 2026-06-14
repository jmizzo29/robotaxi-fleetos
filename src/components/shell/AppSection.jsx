import { spacing, typography } from '../../design/roboagentTokens';

const titleByTier = {
  primary: typography.pageTitle,
  secondary: typography.section,
  tertiary: typography.sectionSm,
};

const gapByTier = {
  primary: spacing.sectionPrimary,
  secondary: spacing.sectionSecondary,
  tertiary: spacing.sectionTertiary,
};

const headMbByTier = {
  primary: 'mb-3.5',
  secondary: 'mb-3',
  tertiary: 'mb-3',
};

export default function AppSection({
  title,
  actionLabel,
  onAction,
  tier = 'secondary',
  className = '',
  children,
  'aria-label': ariaLabel,
}) {
  return (
    <section className={`${gapByTier[tier]} ${className}`} aria-label={ariaLabel || title}>
      {title && (
        <div className={`flex items-center justify-between gap-3 ${headMbByTier[tier]}`}>
          <h2 className={titleByTier[tier]}>{title}</h2>
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 text-[13px] font-semibold text-[#2563eb]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
