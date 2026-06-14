import MonumentSwipeStrip from './MonumentSwipeStrip';
import MonumentUtilityLinks from './MonumentUtilityLinks';
import { monument } from './monumentTokens';

export const COMMAND_SWIPE_PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

export default function MonumentBottomChrome({
  utilityActive = null,
  onNavigate = () => {},
  commandActive = null,
  commandPages = COMMAND_SWIPE_PAGES,
  onCommandSelect,
  onLongPress,
  showCommandRow = true,
  commandAriaLabel = 'Command sections',
  showSwipeHint = true,
  swipeHint = null,
}) {
  const handleCommandSelect = (pageId) => {
    if (onCommandSelect) {
      onCommandSelect(pageId);
      return;
    }
    onNavigate('overview');
  };

  return (
    <div className="shrink-0 border-t" style={{ borderColor: monument.hairline }}>
      <MonumentUtilityLinks
        layout="strip"
        active={utilityActive}
        onNavigate={onNavigate}
      />

      {showCommandRow ? (
        <MonumentSwipeStrip
          active={commandActive || ''}
          pages={commandPages}
          onSelect={handleCommandSelect}
          onLongPress={onLongPress}
          showSwipeHint={showSwipeHint && Boolean(swipeHint || commandActive)}
          swipeHint={swipeHint}
          ariaLabel={commandAriaLabel}
        />
      ) : (
        <div
          className="shrink-0 touch-manipulation pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
          onPointerDown={(event) => {
            if (!onLongPress) return;
            event.currentTarget.dataset.pressStart = String(Date.now());
          }}
          onPointerUp={(event) => {
            if (!onLongPress) return;
            const started = Number(event.currentTarget.dataset.pressStart || 0);
            if (started && Date.now() - started >= 500) onLongPress();
            delete event.currentTarget.dataset.pressStart;
          }}
          onPointerLeave={(event) => {
            delete event.currentTarget.dataset.pressStart;
          }}
        >
          <p className="text-center text-[10.8px] font-medium" style={{ color: monument.inkGhost }}>
            Long-press for Account
          </p>
        </div>
      )}
    </div>
  );
}
