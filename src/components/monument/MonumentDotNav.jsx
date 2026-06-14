import { useRef } from 'react';
import { monument } from './monumentTokens';

const TABS = ['today', 'fleet', 'grow'];

export default function MonumentDotNav({ active = 'today', onChange, onLongPress }) {
  const pressTimer = useRef(null);

  const clearPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const startPress = () => {
    clearPress();
    if (!onLongPress) return;
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      onLongPress();
    }, 500);
  };

  return (
    <nav
      className="flex items-center justify-center gap-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Fleet navigation"
      onPointerDown={startPress}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(tab)}
            className="rounded-full p-2 touch-manipulation"
            aria-label={tab}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className="block rounded-full transition-all"
              style={{
                width: isActive ? 6 : 5,
                height: isActive ? 6 : 5,
                backgroundColor: isActive ? monument.ink : monument.hairline,
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
