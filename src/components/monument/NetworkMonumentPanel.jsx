import { monument, monumentType } from './monumentTokens';

export default function NetworkMonumentPanel({ convoy }) {
  if (!convoy) return null;

  const tiles = [
    { key: 'austin', label: 'Austin', value: String(convoy.austin ?? 0) },
    { key: 'orlando', label: 'Orlando', value: String(convoy.orlando ?? 0) },
    { key: 'events', label: 'Events', value: String(convoy.events ?? 0) },
  ];

  return (
    <div className="w-full px-5 pb-3">
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="rounded-xl border px-2 py-3 text-center"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>{tile.label}</p>
            <p
              className={`mt-2 ${monumentType.monumentSm}`}
              style={{ color: monument.ink }}
            >
              {convoy.configured ? tile.value : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
