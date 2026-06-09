export default function RoboWordmark({
  className = '',
  colorClass = 'text-[#172231]',
  variant = 'default',
}) {
  if (variant === 'calm') {
    return (
      <span className={`font-brand font-semibold tracking-tight ${colorClass} ${className}`}>
        RoboAgent
      </span>
    );
  }

  return (
    <span className={`font-brand font-bold uppercase ${colorClass} ${className}`}>
      ROBOAGENT
    </span>
  );
}
