import { useEffect, useRef } from 'react';
import { monument, monumentType } from './monumentTokens';

const UTILITY_LINKS = [
  { id: 'map', label: 'Map' },
  { id: 'network', label: 'Network' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];

export default function MonumentUtilityLinks({
  onNavigate,
  active = null,
  layout = 'strip',
}) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (layout !== 'strip' || !active || !activeRef.current) return;
    activeRef.current.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [active, layout]);

  if (layout === 'strip') {
    return (
      <nav
        className="flex items-center gap-6 overflow-x-auto overscroll-x-contain px-4 py-3 snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        aria-label="Fleet utilities"
      >
        {UTILITY_LINKS.map((link) => {
          const isActive = active === link.id;
          return (
            <button
              key={link.id}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={`shrink-0 snap-center whitespace-nowrap ${monumentType.navLabel} transition-opacity active:opacity-70 ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ color: isActive ? monument.action : monument.inkGhost }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>
    );
  }

  if (layout === 'dock') {
    return (
      <nav
        className="flex items-center gap-6 overflow-x-auto overscroll-x-contain px-4 py-3 snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        aria-label="Fleet utilities"
      >
        {UTILITY_LINKS.map((link) => {
          const isActive = active === link.id;
          return (
            <button
              key={link.id}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => onNavigate?.(link.id)}
              className={`shrink-0 snap-center whitespace-nowrap rounded-xl px-2 py-2 ${monumentType.navLabel} transition active:scale-[0.98] ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
              style={{
                backgroundColor: isActive ? monument.ledgerWash : 'transparent',
                color: isActive ? monument.ink : monument.inkMuted,
              }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>
    );
  }

  return null;
}
