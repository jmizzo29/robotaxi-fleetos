import { getMapFeaturedVehicle, getMapPreviewVehicles } from '../../utils/commandHomeUtils';

const zoneLabels = [
  { label: 'AIRPORT', left: '8%', top: '28%' },
  { label: 'DOWNTOWN', left: '38%', top: '22%' },
  { label: 'DISNEY', left: '62%', top: '38%' },
  { label: 'STAGING', left: '72%', top: '58%' },
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

function buildMapCaption(markers, featured, realFleet) {
  const inMotion = markers.filter((marker) => marker.tone === 'active').length;
  const cities = [...new Set(
    realFleet
      .map((vehicle) => String(vehicle.city || '').split(',')[0].trim())
      .filter(Boolean),
  )].slice(0, 3);

  if (inMotion > 0 && cities.length > 0) {
    return `${inMotion} in motion · ${cities.join(' · ')}`;
  }
  if (featured?.name) {
    return `${featured.name} · ${featured.event}`;
  }
  if (inMotion > 0) {
    return `${inMotion} in motion`;
  }
  return `${markers.length} assets tracked`;
}

export default function CommandMapPreview({ fleet = [], realFleet = [], onNavigate }) {
  const markers = getMapPreviewVehicles(fleet, realFleet);
  const featured = getMapFeaturedVehicle(fleet, realFleet);
  const caption = buildMapCaption(markers, featured, realFleet);

  return (
    <section aria-label="Live fleet map">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">Live fleet map</p>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-[10px] font-semibold text-[#599CE7] transition active:opacity-70"
        >
          Full map
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('map')}
        className="relative block w-full overflow-hidden rounded-[14px] border border-white/10 bg-[#06080c] text-left transition active:brightness-110"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M10 55 Q35 40 55 50 T90 45"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
            opacity={0.5}
          />
          <path
            d="M15 70 Q45 62 75 68"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.6"
            opacity={0.35}
          />
        </svg>

        <div className="relative h-[132px]">
          {zoneLabels.map((zone) => (
            <span
              key={zone.label}
              className="absolute text-[8px] font-semibold tracking-[0.04em] text-white/30"
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

          <div className="absolute bottom-2 left-2 right-2 rounded-full border border-white/10 bg-black/80 px-2.5 py-1.5 text-[9px] font-semibold text-white">
            {caption}
          </div>
        </div>
      </button>
    </section>
  );
}
