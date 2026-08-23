import { spacing, colors } from '../../design/roboagentTokens';

export default function AppShell({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen text-[#F3F3F1] ${spacing.page} ${className}`}
      style={{ backgroundColor: colors.canvas, backgroundImage: colors.canvasWash }}
    >
      {children}
    </div>
  );
}
