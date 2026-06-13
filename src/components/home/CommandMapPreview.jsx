import CommandLivePulse from './CommandLivePulse';
import { getMapFeaturedVehicle, getMapPreviewVehicles } from '../../utils/commandHomeUtils';

function Eyebrow({ children }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">{children}</span>
  );
}

const zoneLabels = [
  { label: 'AIRPORT', left: '8%', top: '28%', tone: 'blue' },
  { label: 'DOWNTOWN', left: '38%', top: '22%', tone: 'blue' },
  { label: 'DISNEY', left: '62%', top: '38%', tone: 'green' },
  { label: 'STAGING', left: '72%', top: '58%', tone: 'amber' },
];

const zoneGlowClass = {
  blue: 'bg-[#599CE7]/10',
  green: 'bg-emerald-400/10',
  amber: 'bg-amber-400/10',
};

function MarkerDot({ tone = 'active', animated = true }) {
  const color = tone === 'charging' ? 'bg-[#599CE7]' : 'bg-emerald-400';
  const ping = tone === 'charging' ? 'command-led-charge' : 'command-led-live';

  return (
    <span className={`relative flex h-2.5 w-2.5 ${animated ? 'command-marker-drift' : ''}`}>
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 ${color} ${animated ? 'command-live-ping' : ''}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color} ${animated ? ping : ''}`} />
    </span>
  );
}

function buildMapCaption(markers, featured, realFleet, activeCount) {
  const inMotion = markers.filter((marker) => marker.tone === 'active').length;
  const cities = [...new Set(
    realFleet
      .map((vehicle) => String(vehicle.city || '').split(',')[0].trim())
      .filter(Boolean),
  )].slice(0, 3);

  const motionCount = inMotion || activeCount;

  if (motionCount > 0 && cities.length > 0) {
    return `${motionCount} in motion · ${cities.join(' · ')}`;
  }
  if (featured?.name) {
    return `${featured.name} · ${featured.event}`;
  }
  if (motionCount > 0) {
    return `${motionCount} in motion`;
  }
  return `${markers.length} assets tracked`;
}

export default function CommandMapPreview({
  fleet = [],
  realFleet = [],
  onNavigate,
  activeCount = 0,
}) {
  const markers = getMapPreviewVehicles(fleet, realFleet);
  const featured = getMapFeaturedVehicle(fleet, realFleet);
  const caption = buildMapCaption(markers, featured, realFleet, activeCount);

  return (
    <section aria-label="Live fleet map">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eyebrow>Live fleet map</Eyebrow>
          <CommandLivePulse tone="live" />
        </div>
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
        className="relative block w-full overflow-hidden rounded-[14px] border border-[#599CE7]/20 bg-[#06080c] text-left transition active:brightness-110"
      >
        <div className="pointer-events-none absolute inset-0 bg-[#599CE7]/[0.04]" aria-hidden="true" />
        <div
          className="command-map-scan pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#599CE7]/20 to-transparent"
          aria-hidden="true"
        />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M10 55 Q35 40 55 50 T90 45"
            fill="none"
            stroke="rgba(89,156,231,0.45)"
            strokeWidth="0.9"
          />
          <path
            d="M15 70 Q45 62 75 68"
            fill="none"
            stroke="rgba(52,211,153,0.18)"
            strokeWidth="0.6"
          />
        </svg>

        <div className="relative h-[132px]">
          {zoneLabels.map((zone) => (
            <span key={zone.label} className="absolute" style={{ left: zone.left, top: zone.top }}>
              <span
                className={`absolute -left-2 -top-2 h-5 w-10 rounded-full blur-md ${zoneGlowClass[zone.tone]}`}
                aria-hidden="true"
              />
              <span className="relative text-[8px] font-semibold tracking-[0.04em] text-white/35">
                {zone.label}
              </span>
            </span>
          ))}

          {markers.map((marker, index) => (
            <span
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: marker.left !== null ? `${marker.left}%` : `${22 + index * 12}%`,
                top: marker.top !== null ? `${marker.top}%` : `${30 + (index % 3) * 18}%`,
                animationDelay: `${index * 0.35}s`,
              }}
            >
              <MarkerDot tone={marker.tone} animated={marker.tone === 'active'} />
            </span>
          ))}

          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-full border border-[#599CE7]/20 bg-black/85 px-2.5 py-1.5">
            <CommandLivePulse tone="live" />
            <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-white">{caption}</span>
          </div>
        </div>
      </button>
    </section>
  );
}
