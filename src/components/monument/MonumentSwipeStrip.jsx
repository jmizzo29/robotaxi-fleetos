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
  pages = DEFAULT_PAGES,
  ariaLabel = 'Command sections',
}) {
  const activeIndex = active ? pages.findIndex((page) => page.id === active) : -1;
  const nextLabel = activeIndex >= 0 && activeIndex < pages.length - 1
    ? pages[activeIndex + 1].label
    : null;

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
        className="flex items-center justify-center gap-6 overflow-x-auto overscroll-x-contain px-4 pb-2 pt-3 snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
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
              className={`shrink-0 snap-center whitespace-nowrap ${monumentType.navLabel} transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
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
