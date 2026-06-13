import { MapPin } from 'lucide-react';
import { getMapFeaturedVehicle, getMapPreviewVehicles } from '../../utils/commandHomeUtils';

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const zoneLabels = [
  { label: 'Airport', left: '12%', top: '24%' },
  { label: 'Downtown', left: '42%', top: '18%' },
  { label: 'Disney', left: '62%', top: '34%' },
  { label: 'Staging', left: '72%', top: '56%' },
];

function MarkerDot({ tone = 'active' }) {
  const color = tone === 'charging' ? 'bg-[#599CE7]' : 'bg-emerald-400';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${color}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export default function CommandMapPreview({ fleet = [], realFleet = [], onNavigate, compact = false }) {
  const markers = getMapPreviewVehicles(fleet, realFleet);
  const featured = getMapFeaturedVehicle(fleet, realFleet);
  const inMotion = markers.filter((marker) => marker.tone === 'active').length;
  const mapHeight = compact ? 'h-[112px]' : 'h-[132px]';

  return (
    <section aria-label="Live fleet map">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Live fleet map</p>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-[11px] font-medium text-[#599CE7] transition active:opacity-70"
        >
          Full map
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
            d="M10 55 Q35 40 55 50 T90 45"
            fill="none"
            stroke="rgba(89,156,231,0.35)"
            strokeWidth="0.8"
          />
          <path
            d="M15 70 Q45 62 75 68"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.6"
          />
        </svg>

        <div className={`relative ${mapHeight}`}>
          {zoneLabels.map((zone) => (
            <span
              key={zone.label}
              className="absolute text-[8px] font-semibold uppercase tracking-[0.08em] text-white/30"
              style={{ left: zone.left, top: zone.top }}
            >
              {zone.label}
            </span>
          ))}

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

      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-2.5 py-1.5 backdrop-blur-sm">
            <MapPin className="h-3 w-3 shrink-0 text-[#599CE7]" strokeWidth={2.2} />
            <div className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white">
              {featured?.name || `${inMotion || markers.length} assets tracked`}
            </div>
            <span className="shrink-0 text-[10px] text-white/45">
              {featured?.event || `${inMotion} in motion`}
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
