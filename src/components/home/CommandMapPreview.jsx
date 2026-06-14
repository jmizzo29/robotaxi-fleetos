import { useMemo, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from '../HeatmapLayer';
import heatmapData from '../../data/heatmapData';
import demandZones from '../../data/demandZones';
import { getCommandOperationalSource, vehicleStateLabel } from '../../utils/vehicleDisplayUtils';
import { AppSection } from '../shell';
import { radius, shadow } from '../../design/roboagentTokens';

const ORLANDO_VIEW = {
  longitude: -81.3792,
  latitude: 28.5383,
  zoom: 10,
};

function getVehicleLabel(vehicle, index) {
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
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 border-t border-slate-200/80 bg-white/96 px-4 py-3 backdrop-blur-md">
      <p className="text-[12px] font-semibold text-slate-800">
        {total} Vehicles <span className="text-slate-300">|</span> {active} Active now
      </p>
      <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Active</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#eab308]" />Charging</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Offline</span>
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

  return (
    <AppSection
      title="Live Fleet Map"
      actionLabel="Full map"
      onAction={() => onNavigate('map')}
      tier={tier}
      aria-label="Live fleet map"
    >
      <div className={`${radius.cardLg} bg-gradient-to-b from-slate-100 to-slate-200/80 p-1 ${shadow.map}`}>
        <div className={`relative overflow-hidden ${radius.card} border border-slate-300/60 shadow-inner ${mapHeightClass}`}>
          {!mapboxToken ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-[#06080c] px-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-white/80">Mapbox token required</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Add <code className="rounded bg-white/10 px-1 py-0.5">VITE_MAPBOX_TOKEN</code> for the live map.
                  </p>
                </div>
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
    </AppSection>
  );
}
