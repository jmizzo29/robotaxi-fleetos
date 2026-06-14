import { monument, monumentType } from './monumentTokens';

function tileValueColor(kind) {
  if (kind === 'orlando') return monument.action;
  if (kind === 'tampa') return monument.money;
  return monument.projected;
}

export default function NetworkMonumentPanel({ convoy, onSelectTile }) {
  if (!convoy) return null;

  const tiles = [
    { key: 'orlando', label: 'Orlando', value: String(convoy.orlando) },
    { key: 'tampa', label: 'Tampa', value: String(convoy.tampa) },
    { key: 'events', label: 'Events', value: String(convoy.events) },
  ];

  return (
    <div className="w-full px-5 pb-3">
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelectTile?.(tile.key)}
            className="rounded-xl border px-2 py-3 text-center transition active:scale-[0.98]"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>{tile.label}</p>
            <p
              className={`mt-2 ${monumentType.monumentSm}`}
              style={{ color: tileValueColor(tile.key) }}
            >
              {tile.value}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
