import RoboWordmark from '../RoboWordmark';
import { spacing, typography } from '../../design/roboagentTokens';

export default function AppHeader({ badge, trailing }) {
  return (
    <header className={`flex items-center justify-between gap-3 ${spacing.headerMb}`}>
      <RoboWordmark className="text-[1.05rem] tracking-[0.04em]" colorClass={typography.wordmarkColor} />
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <p className={typography.screenBadge}>{badge}</p>
        )}
        {trailing}
      </div>
    </header>
  );
}
