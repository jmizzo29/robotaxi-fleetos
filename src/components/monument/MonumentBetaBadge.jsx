import { monument, monumentType } from './monumentTokens';

export default function MonumentBetaBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 ${monumentType.revealHint} font-bold uppercase tracking-[0.14em] ${className}`}
      style={{
        backgroundColor: monument.ledgerWash,
        color: monument.projected,
      }}
    >
      Beta
    </span>
  );
}
