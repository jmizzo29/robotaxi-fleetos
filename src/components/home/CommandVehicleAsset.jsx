const CYBERCAB_HERO = '/vehicles/cybercab-hero.svg';

const toneStyles = {
  ready: {
    rail: 'bg-emerald-400',
    ring: 'ring-emerald-400/40',
    glow: 'bg-emerald-400/15',
    led: 'bg-emerald-400 command-led-live',
  },
  warning: {
    rail: 'bg-[#599CE7]',
    ring: 'ring-[#599CE7]/45',
    glow: 'bg-[#599CE7]/15',
    led: 'bg-[#599CE7] command-led-charge',
  },
  issue: {
    rail: 'bg-amber-400',
    ring: 'ring-amber-400/35',
    glow: 'bg-amber-400/10',
    led: 'bg-amber-400',
  },
  neutral: {
    rail: 'bg-white/20',
    ring: 'ring-white/10',
    glow: 'bg-white/[0.04]',
    led: 'bg-white/30',
  },
};

function activityLabel(status = '') {
  const value = String(status).toLowerCase();
  if (value.includes('route') || value.includes('online')) return 'live';
  if (value.includes('charg')) return 'charge';
  if (value.includes('offline') || value.includes('asleep')) return 'idle';
  return 'live';
}

export default function CommandVehicleAsset({
  status = 'Online',
  tone = 'neutral',
  className = '',
}) {
  const styles = toneStyles[tone] || toneStyles.neutral;
  const activity = activityLabel(status);

  return (
    <div
      className={`relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#0b0d12] ring-1 ${styles.ring} ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 ${styles.glow}`} />
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.rail}`} />

      <img
        src={CYBERCAB_HERO}
        alt=""
        className="absolute bottom-1 left-1/2 h-[2.1rem] w-[3.6rem] max-w-none -translate-x-1/2 object-contain opacity-95"
        draggable={false}
      />

      <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${styles.led}`} />

      {activity === 'live' && (
        <span className="command-vehicle-pulse absolute inset-0 rounded-[14px] ring-1 ring-emerald-400/25" />
      )}
      {activity === 'charge' && (
        <span className="command-vehicle-charge absolute bottom-0 left-0 right-0 h-0.5 bg-[#599CE7]/80" />
      )}
    </div>
  );
}
