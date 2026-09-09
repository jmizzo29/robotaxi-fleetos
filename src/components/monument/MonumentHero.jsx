import { monument, monumentType } from './monumentTokens';

export default function MonumentHero({
  label,
  amount,
  subline,
  labelColor,
  amountColor,
  onTapAmount,
}) {
  const emptyAmount = amount === '—' || amount === '–' || amount === '-';
  const color = amountColor === 'projected'
    ? monument.projected
    : amountColor === 'action'
      ? monument.action
      : emptyAmount
        ? monument.action
        : amountColor === 'muted'
          ? monument.ink
          : monument.money;

  const content = (
    <p className={`relative mt-5 ${monumentType.monument}`} style={{ color }}>
      <span className="command-hero-bloom command-hero-glow" aria-hidden="true" />
      <span className="relative">{amount}</span>
    </p>
  );

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className={monumentType.label} style={{ color: labelColor || monument.ink }}>{label}</p>
      {onTapAmount ? (
        <button type="button" onClick={onTapAmount} className="relative block">
          {content}
        </button>
      ) : content}
      <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{subline}</p>
    </div>
  );
}
