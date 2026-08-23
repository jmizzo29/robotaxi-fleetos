import { useMemo, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from '../HeatmapLayer';
import heatmapData from '../../data/heatmapData';
import demandZones from '../../data/demandZones';
import { getCommandOperationalSource, vehicleStateLabel } from '../../utils/vehicleDisplayUtils';
import { AppSection } from '../shell';
import { radius } from '../../design/roboagentTokens';

const ORLANDO_VIEW = {
  longitude: -81.3792,
  latitude: 28.5383,
  zoom: 10,
};

function getVehicleLabel(vehicle, index) {
  if (vehicle?.isReal) {
    const name = vehicle.display_name || vehicle.name;
    if (name) return name;
  }
  const id = String(vehicle?.id || vehicle?.name || '');
  const carMatch = id.match(/CAR-(\d+)/i);
  if (carMatch) return `CAB-${carMatch[1].padStart(2, '0')}`;
  const match = id.match(/\d+/);
  if (match) return `CAB-${String(match[0]).padStart(2, '0')}`;
  return vehicle?.name || vehicle?.ownership?.tag || `CAB-${String(index + 1).padStart(2, '0')}`;
}

function isVehicleMoving(vehicle) {
  const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  return status.includes('EN ROUTE')
    || status.includes('REPOSITION')
    || status.includes('PICKUP')
    || status.includes('IN SERVICE');
}

function getMarkerColorClass(vehicle) {
  const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  if (status.includes('OFFLINE') || status.includes('ASLEEP')) return 'bg-[#ef4444]';
  if (status.includes('CHARG')) return 'bg-[#eab308]';
  if (
    status.includes('ONLINE')
    || status.includes('READY')
    || status.includes('EN ROUTE')
    || status.includes('PICKUP')
    || status.includes('REPOSITION')
    || status.includes('IDLE')
    || status.includes('SERVICE')
  ) {
    return 'bg-[#22c55e]';
  }
  return vehicleStateLabel(vehicle) === 'Charging' ? 'bg-[#eab308]' : 'bg-[#22c55e]';
}

function getMapFleet(fleet, realFleet, totalEarnings, syncState) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  return source.filter((vehicle) => {
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });
}

function MapFooter({ total, active }) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-gradient-to-t from-[#1C1D21] via-[#1C1D21]/80 to-transparent px-5 pb-4 pt-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
        {total} vehicles <span className="text-white/30">·</span> {active} active
      </p>
      <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#5BA8A0]" />Active</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#C4A35A]" />Charge</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#C45C4A]" />Off</span>
      </div>
    </div>
  );
}

function DemandZonesLayer() {
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: demandZones.map((zone) => ({
      type: 'Feature',
      properties: {
        color: zone.color,
        demand: zone.demand,
        name: zone.name,
      },
      geometry: {
        type: 'Point',
        coordinates: [zone.longitude, zone.latitude],
      },
    })),
  }), []);

  return (
    <Source id="command-demand-zones" type="geojson" data={geojson}>
      <Layer
        id="command-demand-zone-glow"
        type="circle"
        paint={{
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            18,
            10,
            36,
            12,
            58,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.34,
          'circle-blur': 0.45,
        }}
      />
    </Source>
  );
}

function DemandZoneLabel({ zone }) {
  const shortName = zone.name.includes('Airport') ? 'MCO' : zone.name.split(' ')[0];
  const surge = Math.round(zone.demand * 0.26);
  const hourlyEst = Math.round((zone.profitability || 75) * (zone.surgeMultiplier || 1.2) * 3.8);

  return (
    <div className="pointer-events-none -translate-y-2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-950/92 px-2.5 py-1.5 shadow-lg shadow-black/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-200">{shortName}</p>
      <p className="text-[11px] font-bold text-emerald-300">~${hourlyEst}/hr</p>
      <p className="text-[10px] font-semibold text-white/75">+{surge}% demand</p>
    </div>
  );
}

function TripTracesLayer({ vehicles, zones }) {
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: vehicles
      .filter(isVehicleMoving)
      .map((vehicle, index) => {
        const zone = zones[index % Math.max(zones.length, 1)];
        if (!zone) return null;
        return {
          type: 'Feature',
          properties: { id: vehicle.id },
          geometry: {
            type: 'LineString',
            coordinates: [
              [Number(vehicle.longitude), Number(vehicle.latitude)],
              [zone.longitude, zone.latitude],
            ],
          },
        };
      })
      .filter(Boolean),
  }), [vehicles, zones]);

  if (!geojson.features.length) return null;

  return (
    <Source id="command-trip-traces" type="geojson" data={geojson}>
      <Layer
        id="command-trip-trace-line"
        type="line"
        paint={{
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        }}
      />
    </Source>
  );
}

function LiveVehicleMarker({ vehicle, label }) {
  const colorClass = getMarkerColorClass(vehicle);
  const isMoving = isVehicleMoving(vehicle);
  const isActive = colorClass.includes('22c55e');
  const isCharging = colorClass.includes('eab308');
  const statusWord = isMoving ? 'En route' : isCharging ? 'Charging' : isActive ? 'Active' : 'Offline';

  return (
    <div className="relative flex flex-col items-center" title={`${label} · ${statusWord}`}>
      {(isActive || isMoving) && (
        <span
          className={`absolute h-10 w-10 rounded-full opacity-35 ${isMoving ? 'animate-ping' : 'animate-pulse'} ${colorClass}`}
          aria-hidden="true"
        />
      )}
      <div
        className={`relative h-4 w-4 rounded-full border-2 border-white shadow-md ${colorClass} ${isMoving ? 'animate-bounce' : ''}`}
        style={isMoving ? { animationDuration: '2.4s' } : undefined}
      />
      <span className="mt-1 rounded-md bg-slate-950/88 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.04em] text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}

export default function CommandMapPreview({
  fleet = [],
  realFleet = [],
  totalEarnings = 0,
  syncState = 'idle',
  onNavigate,
  activeCount = 0,
  totalCount = 0,
  mapHeightClass = 'h-[420px]',
  tier = 'primary',
  bare = false,
  flush = false,
}) {
  const [viewState, setViewState] = useState(ORLANDO_VIEW);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const vehicles = useMemo(
    () => getMapFleet(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );
  const featuredZones = useMemo(
    () => [...demandZones].sort((a, b) => b.demand - a.demand).slice(0, 3),
    [],
  );
  const total = totalCount || vehicles.length || getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState).length;
  const active = activeCount || vehicles.filter((vehicle) => {
    const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
    return !status.includes('OFFLINE') && !status.includes('ASLEEP') && !status.includes('CHARG');
  }).length;

  const mapFrame = (
    <div className={flush ? 'h-full w-full' : bare ? 'w-full px-5' : `${radius.cardLg} bg-[#25262B] p-px`}>
      <div
        className={`relative overflow-hidden ${flush ? 'h-full' : bare ? 'rounded-[8px] border border-white/[0.08]' : `${radius.card} border border-white/[0.08]`} ${mapHeightClass}`}
      >
        {!mapboxToken ? (
          <>
            <div className="absolute inset-0">
              <img
                src="/landing/night-command.jpg"
                alt=""
                className="h-full w-full object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,18,0.35)_0%,rgba(14,15,18,0.15)_40%,rgba(14,15,18,0.72)_100%)]" />
            </div>
            <MapFooter total={total} active={active} />
          </>
        ) : (
          <Map
            {...viewState}
            onMove={(event) => setViewState(event.viewState)}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={mapboxToken}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            reuseMaps
            touchPitch={false}
          >
            <HeatmapLayer heatmapData={heatmapData} />
            <DemandZonesLayer />
            <TripTracesLayer vehicles={vehicles} zones={featuredZones} />
            {featuredZones.map((zone) => (
              <Marker
                key={zone.name}
                longitude={zone.longitude}
                latitude={zone.latitude}
                anchor="bottom"
              >
                <DemandZoneLabel zone={zone} />
              </Marker>
            ))}
            {vehicles.map((vehicle, index) => (
              <Marker
                key={vehicle.id || getVehicleLabel(vehicle, index)}
                longitude={Number(vehicle.longitude)}
                latitude={Number(vehicle.latitude)}
                anchor="bottom"
              >
                <LiveVehicleMarker vehicle={vehicle} label={getVehicleLabel(vehicle, index)} />
              </Marker>
            ))}
          </Map>
        )}

        {mapboxToken && <MapFooter total={total} active={active} />}
      </div>
    </div>
  );

  if (bare) return mapFrame;

  return (
    <AppSection
      title="Live Fleet Map"
      actionLabel="Full map"
      onAction={() => onNavigate?.('map')}
      tier={tier}
      aria-label="Live fleet map"
    >
      {mapFrame}
    </AppSection>
  );
}
