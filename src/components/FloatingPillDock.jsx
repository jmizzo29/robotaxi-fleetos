import { useRef } from 'react';
import { colors, icon as iconTokens, typography } from '../design/roboagentTokens';

const LONG_PRESS_MS = 500;

const DOCK_SHELL = {
  background: 'rgba(28, 29, 33, 0.86)',
  boxShadow: [
    '0 12px 36px rgba(0, 0, 0, 0.42)',
    '0 0 0 1px rgba(243, 243, 241, 0.06)',
    'inset 0 1px 0 rgba(243, 243, 241, 0.1)',
  ].join(', '),
};

function DockItem({ item }) {
  const Icon = item.icon;
  const active = Boolean(item.active);

  return (
    <button
      type="button"
      onClick={() => item.onSelect?.(item.id)}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className="relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 touch-manipulation transition active:scale-[0.98]"
    >
      <span
        className="relative flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          backgroundColor: active ? colors.primaryLight : 'transparent',
        }}
      >
        {Icon ? (
          <Icon
            size={iconTokens.nav}
            strokeWidth={active ? iconTokens.navStroke : iconTokens.navStrokeIdle}
            className="flex-shrink-0"
            style={{ color: active ? colors.primary : colors.navIdle }}
            aria-hidden="true"
          />
        ) : null}
        {item.badge ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C45C4A] px-1 text-[9px] font-bold text-white">
            {item.badge}
          </span>
        ) : null}
      </span>
      <span
        className={`w-full max-w-[4.6rem] px-0.5 text-center ${typography.navLabel}`}
        style={{ color: active ? colors.primary : colors.navIdle }}
      >
        {item.label}
      </span>
    </button>
  );
}

function DockRow({ items }) {
  return (
    <div
      className="grid items-stretch"
      style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <DockItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function FloatingPillDock({
  items = [],
  rows = null,
  ariaLabel = 'Primary navigation',
  onLongPress,
  hint = null,
}) {
  const pressTimer = useRef(null);
  const resolvedRows = (rows && rows.length ? rows : [items]).filter((row) => row.length > 0);
  const multiRow = resolvedRows.length > 1;

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
    }, LONG_PRESS_MS);
  };

  return (
    <div
      className="px-4 pt-1"
      style={{ paddingBottom: 'max(0.7rem, env(safe-area-inset-bottom, 0px))' }}
    >
      {hint ? (
        <p
          className="pb-1.5 text-center text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color: colors.navIdle }}
        >
          {hint}
        </p>
      ) : null}

      <nav
        data-testid="mobile-pill-dock"
        aria-label={ariaLabel}
        className={`${multiRow ? 'rounded-[1.85rem]' : 'rounded-full'} border backdrop-blur-xl`}
        style={{
          background: DOCK_SHELL.background,
          borderColor: 'rgba(91, 168, 160, 0.16)',
          boxShadow: DOCK_SHELL.boxShadow,
        }}
        onPointerDown={onLongPress ? startPress : undefined}
        onPointerUp={onLongPress ? clearPress : undefined}
        onPointerLeave={onLongPress ? clearPress : undefined}
        onPointerCancel={onLongPress ? clearPress : undefined}
      >
        <div className={`px-1.5 py-1.5 ${multiRow ? 'space-y-0.5' : ''}`}>
          {resolvedRows.map((row) => (
            <DockRow key={row.map((item) => item.id).join('-')} items={row} />
          ))}
        </div>
      </nav>
    </div>
  );
}
