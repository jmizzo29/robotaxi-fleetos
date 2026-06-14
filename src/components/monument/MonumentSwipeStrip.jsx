import { monument, monumentType } from './monumentTokens';

const PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

export default function MonumentSwipeStrip({
  active = 'today',
  onSelect,
  onLongPress,
  showSwipeHint = true,
}) {
  const activeIndex = PAGES.findIndex((page) => page.id === active);
  const nextLabel = activeIndex < PAGES.length - 1 ? PAGES[activeIndex + 1].label : null;

  return (
    <div
      className="shrink-0 touch-manipulation"
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
      <div
        className="flex items-center justify-center gap-6 px-4 pb-2 pt-3"
        role="tablist"
        aria-label="Command sections"
      >
        {PAGES.map((page) => {
          const isActive = page.id === active;
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect?.(page.id)}
              className={`${monumentType.navLabel} transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
              style={{ color: isActive ? monument.ink : monument.inkGhost }}
            >
              {page.label}
            </button>
          );
        })}
      </div>

      {showSwipeHint && nextLabel && (
        <p
          className={`pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center ${monumentType.revealHint}`}
          style={{ color: monument.inkGhost }}
        >
          {`Swipe for ${nextLabel}`}
        </p>
      )}
    </div>
  );
}
