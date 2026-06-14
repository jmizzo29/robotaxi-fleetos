import { monument, monumentType } from './monumentTokens';

function tileValueColor(kind) {
  if (kind === 'tesla') return monument.money;
  if (kind === 'mapbox') return monument.action;
  if (kind === 'ai') return monument.action;
  return monument.inkMuted;
}

export default function IntegrationsMonumentPanel({ convoy, onSelectTile }) {
  if (!convoy) return null;

  const tiles = [
    { key: 'tesla', label: 'Tesla', value: convoy.tesla },
    { key: 'mapbox', label: 'Mapbox', value: convoy.mapbox },
    { key: 'ai', label: 'AI', value: convoy.ai },
    { key: 'memory', label: 'Memory', value: convoy.memory },
  ];

  return (
    <div className="w-full px-5 pb-3">
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelectTile?.(tile.key)}
            className="rounded-xl border px-1.5 py-3 text-center transition active:scale-[0.98]"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            <p className={`${monumentType.label} text-[9px]`} style={{ color: monument.inkGhost }}>{tile.label}</p>
            <p
              className="mt-2 text-[18px] font-bold leading-none tabular-nums"
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
