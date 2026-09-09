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
            className="command-glass-tile rounded-xl border px-2 py-3 text-center"
            style={{ borderColor: monument.action, boxShadow: '0 0 24px rgba(94,212,200,0.12)' }}
          >
            <p className={monumentType.label} style={{ color: monument.inkMuted }}>{tile.label}</p>
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
