import { monument, monumentType } from './monumentTokens';

function tileValueColor(kind, value) {
  if (kind === 'down' && Number(value) > 0) return monument.projected;
  return monument.ink;
}

export default function FleetMonumentPanel({ strip, onSelectStatus }) {
  if (!strip) return null;

  const downCount = (Number(strip.offline?.value) || 0) + (Number(strip.service?.value) || 0);

  const tiles = [
    { key: 'active', label: 'Active', value: strip.active?.value ?? '0' },
    { key: 'charging', label: 'Charge', value: strip.charging?.value ?? '0' },
    { key: 'down', label: 'Down', value: String(downCount) },
  ];

  return (
    <div className="w-full px-8 pb-4">
      <div className="grid grid-cols-3 gap-0 border-t border-white/[0.08]">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelectStatus?.(tile.key)}
            className="px-2 py-4 text-center transition active:opacity-70"
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>{tile.label}</p>
            <p
              className={`mt-2 ${monumentType.monumentSm}`}
              style={{ color: tileValueColor(tile.key, tile.value) }}
            >
              {tile.value}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
