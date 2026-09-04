export default function RoboWordmark({
  className = '',
  colorClass = 'text-[#F3F3F1]',
  variant = 'default',
}) {
  if (variant === 'calm') {
    return (
      <span className={`font-semibold tracking-[0.18em] ${colorClass} ${className}`}>
        ROBOAGENT
      </span>
    );
  }

  return (
    <span className={`font-semibold uppercase tracking-[0.28em] ${colorClass} ${className}`}>
      ROBOAGENT
    </span>
  );
}
