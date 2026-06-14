import { useMemo, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from '../HeatmapLayer';
import heatmapData from '../../data/heatmapData';
import demandZones from '../../data/demandZones';
import { vehicleStateLabel } from '../../utils/vehicleDisplayUtils';

const ORLANDO_VIEW = {
  longitude: -81.3792,
  latitude: 28.5383,
  zoom: 10,
};

function getVehicleName(vehicle) {
  if (!vehicle) return 'Vehicle';
  return vehicle.name || vehicle.ownership?.tag || vehicle.display_name || vehicle.id || 'Tesla';
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
  ) {
    return 'bg-[#22c55e]';
  }
  return vehicleStateLabel(vehicle) === 'Charging' ? 'bg-[#eab308]' : 'bg-[#22c55e]';
}

function getMapFleet(fleet, realFleet) {
  const source = realFleet.length > 0 ? realFleet : fleet;
  return source.filter((vehicle) => {
    const lat = Number(vehicle.latitude);
    const lng = Number(vehicle.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });
}

function MapFooter({ total, active }) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 border-t border-white/10 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-slate-800">
        {total} Vehicles <span className="text-slate-400">|</span> {active} Active now
      </p>
      <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-500">
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
            14,
            10,
            28,
            12,
            52,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.24,
          'circle-blur': 0.55,
        }}
      />
    </Source>
  );
}

function LiveVehicleMarker({ vehicle }) {
  const colorClass = getMarkerColorClass(vehicle);
  const isActive = colorClass.includes('22c55e');

  return (
    <div className="relative flex h-8 w-8 items-center justify-center" title={getVehicleName(vehicle)}>
      {isActive && (
        <span className={`absolute h-8 w-8 animate-ping rounded-full opacity-40 ${colorClass}`} aria-hidden="true" />
      )}
      <div className={`relative h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ${colorClass}`} />
    </div>
  );
}

export default function CommandMapPreview({
  fleet = [],
  realFleet = [],
  onNavigate,
  activeCount = 0,
  totalCount = 0,
  mapHeightClass = 'h-[380px]',
}) {
  const [viewState, setViewState] = useState(ORLANDO_VIEW);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const vehicles = useMemo(() => getMapFleet(fleet, realFleet), [fleet, realFleet]);
  const total = totalCount || vehicles.length || fleet.length;
  const active = activeCount || vehicles.filter((vehicle) => {
    const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
    return !status.includes('OFFLINE') && !status.includes('ASLEEP') && !status.includes('CHARG');
  }).length;

  return (
    <section aria-label="Live fleet map">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-950">Live Fleet Map</h2>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="text-[13px] font-semibold text-[#2563eb]"
        >
          Full map
        </button>
      </div>

      <div
        className={`relative overflow-hidden rounded-[20px] border border-slate-200 shadow-[0_14px_36px_-20px_rgba(15,23,42,0.45)] ${mapHeightClass}`}
      >
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
            {vehicles.map((vehicle) => (
              <Marker
                key={vehicle.id || getVehicleName(vehicle)}
                longitude={Number(vehicle.longitude)}
                latitude={Number(vehicle.latitude)}
              >
                <LiveVehicleMarker vehicle={vehicle} />
              </Marker>
            ))}
          </Map>
        )}

        {mapboxToken && <MapFooter total={total} active={active} />}
      </div>
    </section>
  );
}
