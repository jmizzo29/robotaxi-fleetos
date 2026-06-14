import { monument, monumentType } from './monumentTokens';

export default function MonumentHero({
  label,
  amount,
  subline,
  labelColor,
  amountColor,
  onTapAmount,
}) {
  const color = amountColor === 'projected'
    ? monument.projected
    : amountColor === 'action'
      ? monument.action
      : amountColor === 'muted'
        ? monument.ink
        : monument.money;

  const content = (
    <p className={`mt-5 ${monumentType.monument}`} style={{ color }}>
      {amount}
    </p>
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className={monumentType.label} style={{ color: labelColor || monument.inkGhost }}>{label}</p>
      {onTapAmount ? (
        <button type="button" onClick={onTapAmount} className="block">
          {content}
        </button>
      ) : content}
      <p className={`mt-4 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{subline}</p>
    </div>
  );
}
