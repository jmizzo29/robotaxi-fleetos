import { monument, monumentType } from './monumentTokens';

const DEFAULT_PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

export default function MonumentSwipeStrip({
  active = 'today',
  onSelect,
  onLongPress,
  showSwipeHint = true,
  swipeHint = null,
  pages = DEFAULT_PAGES,
  ariaLabel = 'Command sections',
}) {
  const activeIndex = active ? pages.findIndex((page) => page.id === active) : -1;
  const nextLabel = swipeHint || (activeIndex >= 0 && activeIndex < pages.length - 1
    ? pages[activeIndex + 1].label
    : null);

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
        className="grid grid-cols-3 gap-0.5 px-2 pb-2 pt-2"
        role="tablist"
        aria-label={ariaLabel}
      >
        {pages.map((page) => {
          const isActive = page.id === active;
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect?.(page.id)}
              className={`relative min-w-0 px-0.5 py-1 text-center ${monumentType.navLabelCompact} transition-colors`}
              style={{ color: isActive ? monument.ink : monument.navIdle }}
            >
              {page.label}
              {isActive && (
                <span
                  className="absolute inset-x-6 -bottom-0.5 h-px"
                  style={{ backgroundColor: monument.action, boxShadow: '0 0 8px rgba(91,168,160,0.4)' }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {showSwipeHint && nextLabel && (
        <p
          className={`pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center ${monumentType.revealHint}`}
          style={{ color: monument.navIdle }}
        >
          {`Swipe for ${nextLabel}`}
        </p>
      )}
    </div>
  );
}
