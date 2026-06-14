import { monument, monumentType } from './monumentTokens';

function tileValueColor(kind) {
  if (kind === 'active') return monument.money;
  if (kind === 'charging') return monument.projected;
  return monument.inkMuted;
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
    <div className="w-full px-5 pb-3">
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelectStatus?.(tile.key)}
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
