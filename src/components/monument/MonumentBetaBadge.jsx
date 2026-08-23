import { monument, monumentType } from './monumentTokens';

export default function MonumentBetaBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 ${monumentType.revealHint} font-medium uppercase tracking-[0.16em] ${className}`}
      style={{
        backgroundColor: 'rgba(243,243,241,0.06)',
        color: monument.inkMuted,
      }}
    >
      Beta
    </span>
  );
}
