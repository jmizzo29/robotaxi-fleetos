import { monument } from '../../design/monumentTokens';

const TABS = ['today', 'fleet', 'grow'];

export default function MonumentDotNav({ active = 'today', onChange }) {
  return (
    <nav
      className="flex items-center justify-center gap-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Fleet navigation"
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(tab)}
            className="rounded-full p-2"
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
