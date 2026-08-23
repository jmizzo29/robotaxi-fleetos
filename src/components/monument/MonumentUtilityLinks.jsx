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
        className="grid grid-cols-4 gap-0.5 px-2 py-2.5"
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
              aria-label={link.label}
              className={`min-w-0 px-0.5 py-1 text-center ${monumentType.navLabelCompact} transition-colors active:opacity-80`}
              style={{ color: isActive ? monument.action : monument.navIdle }}
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
        className="grid grid-cols-4 gap-0.5 px-2 py-2.5"
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
              aria-label={link.label}
              className={`min-w-0 rounded-xl px-0.5 py-1.5 text-center ${monumentType.navLabelCompact} transition active:scale-[0.98]`}
              style={{
                backgroundColor: isActive ? 'rgba(243,243,241,0.06)' : 'transparent',
                color: isActive ? monument.ink : monument.navIdle,
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
