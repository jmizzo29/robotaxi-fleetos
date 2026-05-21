import { getVehicleOwnership } from '../data/vehicleOwnership';

const paintClasses = {
  white: 'from-white via-slate-200 to-slate-500',
  black: 'from-slate-700 via-slate-950 to-black',
  blue: 'from-sky-400 via-blue-700 to-slate-950',
  silver: 'from-slate-100 via-slate-400 to-slate-700',
  graphite: 'from-slate-400 via-slate-700 to-slate-950',
};

function paintKey(color = '') {
  const value = color.toLowerCase();
  if (value.includes('white')) return 'white';
  if (value.includes('black')) return 'black';
  if (value.includes('blue')) return 'blue';
  if (value.includes('silver')) return 'silver';
  if (value.includes('graphite') || value.includes('gray') || value.includes('grey')) return 'graphite';
  return 'silver';
}

function trimVin(value = '') {
  if (!value) return 'VIN unavailable';
  return value.length > 10 ? `${value.slice(0, 5)}...${value.slice(-5)}` : value;
}

function scoreTone(value) {
  if (value >= 70) return 'text-emerald-300';
  if (value >= 40) return 'text-amber-300';
  return 'text-rose-300';
}

function Ring({ value = 0, label = 'Battery' }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const degrees = Math.round((safeValue / 100) * 360);

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-950">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#34d399 ${degrees}deg, rgba(148,163,184,0.18) ${degrees}deg)`,
        }}
      />
      <div className="absolute inset-2 rounded-full bg-slate-950" />
      <div className="relative text-center">
        <p className={`text-2xl font-black ${scoreTone(safeValue)}`}>{safeValue}%</p>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/55 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

export default function VehicleIdentityPlate({
  vehicle,
  ownership: explicitOwnership,
  compact = false,
  className = '',
}) {
  const ownership = explicitOwnership || vehicle?.ownership || getVehicleOwnership(vehicle) || {};
  const name = vehicle?.name || vehicle?.display_name || vehicle?.id || 'Vehicle';
  const model = ownership.model || (vehicle?.isReal ? 'Tesla Vehicle' : 'Fleet Vehicle');
  const year = ownership.modelYear || '----';
  const color = ownership.color || 'Unspecified';
  const tag = ownership.tag || name;
  const battery = Number(vehicle?.battery) || 0;
  const paint = paintClasses[paintKey(color)];

  if (compact) {
    return (
      <div className={`relative h-full w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950 ${className}`}>
        <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${paint}`} />
        <div className="flex h-full items-center justify-center px-2 pt-2">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{tag}</p>
            <p className="mt-0.5 text-lg font-black leading-none text-slate-100">{Math.round(battery)}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/25 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_10%_100%,rgba(16,185,129,0.16),transparent_34%)]" />
      <div className={`absolute inset-x-0 top-0 h-3 bg-gradient-to-r ${paint}`} />

      <div className="relative grid grid-cols-1 gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
              {vehicle?.isReal ? 'Live Tesla' : 'Fleet Asset'}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
              {vehicle?.status || vehicle?.state || 'Ready'}
            </span>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300">{year}</p>
          <h3 className="mt-1 truncate text-4xl font-black tracking-tight text-white md:text-5xl">
            {model}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-slate-300">
            <span>{tag}</span>
            <span className="text-slate-600">/</span>
            <span>{color}</span>
            <span className="text-slate-600">/</span>
            <span>{trimVin(vehicle?.vin)}</span>
          </div>
        </div>

        <Ring value={battery} />
      </div>

      <div className="relative grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 md:grid-cols-4">
        <MiniStat label="Charging" value={vehicle?.chargingState || 'Unavailable'} />
        <MiniStat label="Odometer" value={vehicle?.odometer ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : 'Unavailable'} />
        <MiniStat label="Software" value={vehicle?.softwareVersion || 'Unavailable'} />
        <MiniStat label="Locked" value={vehicle?.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'} />
      </div>
    </div>
  );
}
