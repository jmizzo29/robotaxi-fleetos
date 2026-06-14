import { spacing, colors } from '../../design/roboagentTokens';

export default function AppShell({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen text-slate-900 ${spacing.page} ${className}`}
      style={{ backgroundColor: colors.canvas }}
    >
      {children}
    </div>
  );
}
