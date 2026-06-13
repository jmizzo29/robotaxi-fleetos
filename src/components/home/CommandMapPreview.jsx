import { getMapPreviewVehicles } from '../../utils/commandHomeUtils';

const MAP_BG = '/command/mockup-reference.png';

function MapPin({ tone = 'active', style }) {
  const colors = {
    active: { ring: 'border-[#22c55e]', bg: 'bg-[#22c55e]', icon: 'text-white' },
    charging: { ring: 'border-[#eab308]', bg: 'bg-[#eab308]', icon: 'text-white' },
    offline: { ring: 'border-[#ef4444]', bg: 'bg-[#ef4444]', icon: 'text-white' },
  };
  const toneSet = colors[tone] || colors.active;

  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] bg-white shadow-md ${toneSet.ring}`}>
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${toneSet.bg}`}>
          <svg viewBox="0 0 16 16" className={`h-3 w-3 ${toneSet.icon}`} fill="currentColor" aria-hidden="true">
            <path d="M3 10c1-3 3-5 5-5s4 2 5 5l1 3H2l1-3Zm4.2-4.8c-1.2 0-2.2.8-2.6 2h5.2c-.4-1.2-1.4-2-2.6-2Z" />
          </svg>
        </span>
      </span>
    </span>
  );
}

export default function CommandMapPreview({
  fleet = [],
  realFleet = [],
  onNavigate,
  activeCount = 0,
  totalCount = 0,
  variant = 'default',
}) {
  const markers = getMapPreviewVehicles(fleet, realFleet, 8);
  const isMockup = variant === 'mockup';
  const total = totalCount || markers.length;
  const active = activeCount || markers.filter((marker) => marker.tone === 'active').length;

  return (
    <section aria-label="Live fleet map">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Live Fleet Map</h2>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-[11px] font-semibold text-[#2563eb]"
        >
          Full map
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('map')}
        className={`relative block w-full overflow-hidden text-left shadow-[0_10px_28px_-18px_rgba(15,23,42,0.35)] ${
          isMockup ? 'h-[168px] rounded-[18px] border border-slate-200' : 'rounded-[14px] border border-white/10 bg-[#06080c]'
        }`}
      >
        {isMockup ? (
          <>
            <img
              src={MAP_BG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_47%] scale-[2.15]"
              draggable={false}
            />
            <div className="absolute inset-0 bg-[#3f6212]/10" aria-hidden="true" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#06080c]" />
        )}

        {markers.slice(0, 6).map((marker, index) => (
          <MapPin
            key={marker.id}
            tone={marker.tone === 'charging' ? 'charging' : index === 2 ? 'offline' : 'active'}
            style={{
              left: marker.left !== null ? `${marker.left}%` : `${18 + index * 13}%`,
              top: marker.top !== null ? `${marker.top}%` : `${28 + (index % 3) * 16}%`,
            }}
          />
        ))}

        <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 py-2.5 ${
          isMockup ? 'bg-white/95 backdrop-blur-sm' : 'bg-black/80'
        }`}
        >
          <p className={`text-[11px] font-semibold ${isMockup ? 'text-slate-800' : 'text-white'}`}>
            {total} Vehicles <span className={isMockup ? 'text-slate-400' : 'text-white/45'}>|</span> {active} Active now
          </p>
          <div className={`flex items-center gap-2 text-[9px] font-semibold ${isMockup ? 'text-slate-500' : 'text-white/55'}`}>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Active</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#eab308]" />Charging</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Offline</span>
          </div>
        </div>
      </button>
    </section>
  );
}
