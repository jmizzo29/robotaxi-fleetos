const paintClasses = {
  white: 'from-white via-slate-300 to-slate-500',
  black: 'from-slate-600 via-slate-900 to-black',
  blue: 'from-sky-400 via-blue-600 to-slate-900',
  silver: 'from-slate-200 via-slate-400 to-slate-600',
  graphite: 'from-slate-400 via-slate-600 to-slate-900',
};

function paintKey(color = '') {
  const value = String(color).toLowerCase();
  if (value.includes('white')) return 'white';
  if (value.includes('black')) return 'black';
  if (value.includes('blue')) return 'blue';
  if (value.includes('silver')) return 'silver';
  if (value.includes('graphite') || value.includes('gray') || value.includes('grey')) return 'graphite';
  return 'graphite';
}

function toneRingClass(tone) {
  if (tone === 'ready') return 'ring-emerald-400/30';
  if (tone === 'warning') return 'ring-amber-400/35';
  if (tone === 'issue') return 'ring-red-400/35';
  return 'ring-white/10';
}

function toneGlowClass(tone) {
  if (tone === 'ready') return 'bg-emerald-400/10';
  if (tone === 'warning') return 'bg-amber-400/10';
  if (tone === 'issue') return 'bg-red-400/10';
  return 'bg-white/[0.04]';
}

export default function FleetVehicleThumbnail({ vehicle, ownership, tone = 'neutral', className = '' }) {
  const paint = paintClasses[paintKey(ownership?.color)];
  const isReal = Boolean(vehicle?.isReal);

  return (
    <div
      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-b from-[#141414] to-black ring-1 ${toneRingClass(tone)} ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 ${toneGlowClass(tone)}`} />
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${paint}`} />

      <svg
        viewBox="0 0 80 36"
        className="absolute bottom-2 left-1/2 h-8 w-[3.25rem] -translate-x-1/2 text-white/75"
        fill="currentColor"
      >
        <path d="M8 22c1.2-4.8 4.6-8 9.2-8h35c4.2 0 7.8 2.8 9.2 7.2l2.2 6.8H66c1.7 0 3 1.3 3 3v2.2c0 .8-.7 1.5-1.5 1.5H62a6 6 0 0 1-11.6 0H29.6a6 6 0 0 1-11.6 0H13.5A1.5 1.5 0 0 1 12 29V27c0-1.4 1-2.6 2.3-2.9L8 22Zm10.8-4.8c-2.4 0-4.5 1.5-5.3 3.7h44.9c-.8-2.2-2.9-3.7-5.3-3.7H18.8Z" />
        <circle cx="24" cy="28" r="4.2" fill="#0a0a0a" />
        <circle cx="56" cy="28" r="4.2" fill="#0a0a0a" />
      </svg>

      {isReal ? (
        <span className="absolute bottom-1 left-1 rounded-md border border-white/10 bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white/70">
          Tesla
        </span>
      ) : ownership?.tag ? (
        <span className="absolute bottom-1 left-1 rounded-md border border-white/10 bg-black/50 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white/55">
          {ownership.tag}
        </span>
      ) : null}
    </div>
  );
}
