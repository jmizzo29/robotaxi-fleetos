import { MapPin } from 'lucide-react';
import { getMapFeaturedVehicle, getMapPreviewVehicles } from '../../utils/commandHomeUtils';

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function MarkerDot({ tone = 'active' }) {
  const color = tone === 'charging' ? 'bg-[#599CE7]' : 'bg-emerald-400';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${color}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export default function CommandMapPreview({ fleet = [], realFleet = [], onNavigate }) {
  const markers = getMapPreviewVehicles(fleet, realFleet);
  const featured = getMapFeaturedVehicle(fleet, realFleet);

  return (
    <section aria-label="Mini map preview">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Mini map preview</p>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-[11px] font-medium text-[#599CE7] transition active:opacity-70"
        >
          Open map
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('map')}
        className="relative block w-full overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#06080c] text-left transition active:brightness-110"
      >
        <div className="absolute inset-0 opacity-70" style={gridStyle} aria-hidden="true" />
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M18 38 Q34 30 48 42 T78 34 T88 52"
            fill="none"
            stroke="rgba(89,156,231,0.35)"
            strokeWidth="0.8"
          />
        </svg>

        <div className="relative h-[148px]">
          {markers.map((marker, index) => (
            <span
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: marker.left !== null ? `${marker.left}%` : `${22 + index * 12}%`,
                top: marker.top !== null ? `${marker.top}%` : `${30 + (index % 3) * 18}%`,
              }}
            >
              <MarkerDot tone={marker.tone} />
            </span>
          ))}

          {featured && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#599CE7]" strokeWidth={2.2} />
              <div className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white">
                {featured.name}
              </div>
              <span className="shrink-0 text-[10px] text-white/45">{featured.event}</span>
            </div>
          )}
        </div>
      </button>
    </section>
  );
}
