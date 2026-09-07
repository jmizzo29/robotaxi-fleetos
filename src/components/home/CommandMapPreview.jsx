import { useMemo } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from '../HeatmapLayer';
import heatmapData from '../../data/heatmapData';
import demandZones from '../../data/demandZones';
import { AppSection } from '../shell';
import { radius } from '../../design/roboagentTokens';
import { monument, monumentType } from '../monument/monumentTokens';
import { isMockPreviewEnabled } from '../../utils/mockPreview';
import {
  getMapEmptyCopy,
  getMapLocatedVehicles,
  getMapMarkerTone,
  getMapTruthSource,
  getMapVehicleLabel,
  getMapViewState,
  isVehicleMoving,
  shouldShowMapDemoOverlays,
} from '../../utils/mapTruthUtils';

function MapChrome({ total, active, mock }) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-gradient-to-t from-[#1C1D21] via-[#1C1D21]/80 to-transparent px-5 pb-4 pt-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
        {mock ? 'Demo' : 'Live'}
        <span className="text-white/30"> · </span>
        {total} vehicle{total === 1 ? '' : 's'}
        <span className="text-white/30"> · </span>
        {active} active
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
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-amber-200/80">Demo</p>
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
  const tone = getMapMarkerTone(vehicle);
  const colorClass = tone === 'off' ? 'bg-[#ef4444]' : tone === 'charge' ? 'bg-[#eab308]' : 'bg-[#22c55e]';
  const isMoving = isVehicleMoving(vehicle);
  const isActive = tone === 'active';
  const isCharging = tone === 'charge';
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

function MapEmptyState({ copy, mock }) {
  if (!copy) return null;
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      data-testid="map-empty-state"
    >
      <div
        className="max-w-sm rounded-[10px] border px-5 py-4 text-center"
        style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}
      >
        {mock && (
          <p className={`${monumentType.label} mb-2`} style={{ color: monument.projected }}>Demo preview</p>
        )}
        <p className={monumentType.sheetTitle} style={{ color: monument.ink }}>{copy.title}</p>
        <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>{copy.body}</p>
      </div>
    </div>
  );
}

export default function CommandMapPreview({
  fleet = [],
  realFleet = [],
  syncState = 'idle',
  onNavigate,
  activeCount = 0,
  totalCount = 0,
  mapHeightClass = 'h-[420px]',
  tier = 'primary',
  bare = false,
  flush = false,
  mock = isMockPreviewEnabled(),
  teslaConnected = false,
  showChromeFooter = true,
}) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const showDemoOverlays = shouldShowMapDemoOverlays(mock);
  const source = useMemo(
    () => getMapTruthSource(fleet, realFleet, { mock }),
    [fleet, realFleet, mock],
  );
  const vehicles = useMemo(() => getMapLocatedVehicles(source), [source]);
  const fittedView = useMemo(() => getMapViewState(vehicles, { mock }), [vehicles, mock]);
  const fitKey = `${mock}:${vehicles.map((vehicle) => `${vehicle.id}:${vehicle.latitude}:${vehicle.longitude}`).join('|')}`;

  const featuredZones = useMemo(
    () => (showDemoOverlays ? [...demandZones].sort((a, b) => b.demand - a.demand).slice(0, 3) : []),
    [showDemoOverlays],
  );
  const total = totalCount || source.length;
  const active = activeCount || vehicles.filter((vehicle) => getMapMarkerTone(vehicle) === 'active').length;
  const emptyCopy = getMapEmptyCopy({
    mock,
    loading: syncState === 'loading',
    teslaConnected: teslaConnected || realFleet.length > 0,
    sourceCount: source.length,
    locatedCount: vehicles.length,
  });
  const showEmpty = Boolean(emptyCopy) && vehicles.length === 0 && !showDemoOverlays;

  const mapFrame = (
    <div className={flush ? 'flex h-full min-h-0 w-full flex-col' : bare ? 'w-full px-5' : `${radius.cardLg} bg-[#25262B] p-px`}>
      <div
        className={`relative min-h-0 overflow-hidden ${flush ? 'h-full min-h-0 flex-1' : bare ? 'rounded-[8px] border border-white/[0.08]' : `${radius.card} border border-white/[0.08]`} ${flush ? '' : mapHeightClass}`}
        data-testid="command-map-frame"
        data-map-mock={mock ? 'true' : 'false'}
        data-map-pins={String(vehicles.length)}
      >
        {showDemoOverlays && (
          <p
            className="pointer-events-none absolute left-4 top-4 z-20 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]"
            style={{ backgroundColor: monument.surface, color: monument.projected }}
            data-testid="map-demo-banner"
          >
            Demo preview
          </p>
        )}

        {!mapboxToken ? (
          <div className="absolute inset-0" style={{ backgroundColor: monument.canvas }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,168,160,0.08),transparent_55%)]" />
          </div>
        ) : (
          <Map
            key={fitKey}
            initialViewState={fittedView}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={mapboxToken}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            reuseMaps
            touchPitch={false}
          >
            {showDemoOverlays && <HeatmapLayer heatmapData={heatmapData} />}
            {showDemoOverlays && <DemandZonesLayer />}
            {showDemoOverlays && <TripTracesLayer vehicles={vehicles} zones={featuredZones} />}
            {showDemoOverlays && featuredZones.map((zone) => (
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
                key={vehicle.id || getMapVehicleLabel(vehicle, index, { mock })}
                longitude={Number(vehicle.longitude)}
                latitude={Number(vehicle.latitude)}
                anchor="bottom"
              >
                <LiveVehicleMarker
                  vehicle={vehicle}
                  label={getMapVehicleLabel(vehicle, index, { mock })}
                />
              </Marker>
            ))}
          </Map>
        )}

        {showEmpty && <MapEmptyState copy={emptyCopy} mock={mock} />}
        {showChromeFooter && vehicles.length > 0 && (
          <MapChrome total={total} active={active} mock={mock} />
        )}
      </div>
    </div>
  );

  if (bare || flush) return mapFrame;

  return (
    <AppSection
      title={mock ? 'Demo Fleet Map' : 'Fleet Map'}
      actionLabel="Full map"
      onAction={() => onNavigate?.('map')}
      tier={tier}
      aria-label={mock ? 'Demo fleet map' : 'Fleet map'}
    >
      {mapFrame}
    </AppSection>
  );
}
