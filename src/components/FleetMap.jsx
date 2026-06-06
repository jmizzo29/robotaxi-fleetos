import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BatteryCharging, Gauge, MapPin, Navigation, Zap } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import heatmapData from '../data/heatmapData';
import { maskVin } from '../utils/vinPrivacy';
import { distanceFromOperatingBase, distanceMiles } from '../services/locationIntelligence';

const STATUS = {
  ready: { key: 'ready', label: 'Ready', tone: 'ready', color: '#10b981' },
  active: { key: 'active', label: 'In use', tone: 'active', color: '#0ea5e9' },
  charging: { key: 'charging', label: 'Charging', tone: 'caution', color: '#f59e0b' },
  attention: { key: 'attention', label: 'Attention', tone: 'critical', color: '#ef4444' },
};

const STATUS_ORDER = ['ready', 'active', 'charging', 'attention'];

function statusKey(vehicle) {
  const raw = String(vehicle.status || vehicle.state || '').toLowerCase();
  const charging = String(vehicle.chargingState || '').toLowerCase();
  const battery = Number(vehicle.battery);
  const health = Number(vehicle.maintenanceScore ?? vehicle.healthScore ?? 88);
  const anomaly = Number(vehicle.anomalyRisk || 0);

  if (anomaly > 20 || health < 72 || (Number.isFinite(battery) && battery < 25)) return 'attention';
  if (charging.includes('charging') || charging.includes('plugged')) return 'charging';
  if (
    raw.includes('rental') || raw.includes('pickup') || raw.includes('route')
    || raw.includes('en route') || raw.includes('use') || raw.includes('service')
  ) return 'active';
  return 'ready';
}

function vehicleName(vehicle) {
  return vehicle?.ownership?.tag || vehicle?.name || vehicle?.display_name || vehicle?.id || 'Tesla';
}

function vehicleRoute(vehicle) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [vehicle.longitude, vehicle.latitude],
        [vehicle.targetLng, vehicle.targetLat],
      ],
    },
  };
}

function formatMiles(miles) {
  if (!Number.isFinite(Number(miles))) return null;
  const value = Number(miles);
  return value < 10 ? `${value.toFixed(1)} mi` : `${Math.round(value)} mi`;
}

function buildVehicleIntel(vehicle, { chargingStations, demandZones }) {
  if (!vehicle || !Number.isFinite(Number(vehicle.latitude))) return null;

  const nearestStation = chargingStations
    .map((station) => ({ station, miles: distanceMiles(vehicle, station) }))
    .filter((item) => Number.isFinite(item.miles))
    .sort((a, b) => a.miles - b.miles)[0] || null;

  const zonesByDistance = demandZones
    .map((zone) => ({ zone, miles: distanceMiles(vehicle, zone) }))
    .filter((item) => Number.isFinite(item.miles));
  const bestZone = [...zonesByDistance].sort(
    (a, b) => (b.zone.profitability || 0) - (a.zone.profitability || 0),
  )[0] || null;

  const baseDistance = distanceFromOperatingBase(vehicle);

  return {
    nearestStation,
    bestZone,
    baseMiles: baseDistance?.miles ?? null,
  };
}

function MetricRow({ label, value, emphasize = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-subtle">{label}</span>
      <span className={`min-w-0 truncate text-right ${emphasize ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

function StatChip({ tone, color, label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active ? 'border-ink/15 bg-white text-ink shadow-sm' : 'border-transparent text-ink-muted hover:text-ink'
      }`}
      aria-pressed={active}
    >
      <span className="inline-flex h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
      <span className="tabular-nums font-semibold text-ink">{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LayerToggle({ label, hint, checked, onChange, accent = '#172231', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
        checked ? 'border-ink/12 bg-white shadow-sm' : 'border-transparent bg-ink/[0.03] hover:bg-ink/[0.05]'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />
          {label}
        </span>
        {hint && <span className="mt-0.5 block truncate text-[11px] text-ink-subtle">{hint}</span>}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-accent' : 'bg-ink/15'
        }`}
        aria-hidden="true"
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function VehiclePopupCard({ vehicle, intel, onShowDetail, onQueueCommand }) {
  const key = statusKey(vehicle);
  const status = STATUS[key];
  const name = vehicleName(vehicle);
  const battery = Number.isFinite(Number(vehicle.battery)) ? Math.round(Number(vehicle.battery)) : null;
  const health = Math.round(Number(vehicle.maintenanceScore ?? vehicle.healthScore ?? 88));

  const repositionTarget = intel?.bestZone?.zone;
  const chargeTarget = intel?.nearestStation?.station;

  return (
    <div className="w-[244px] overflow-hidden rounded-2xl border border-ink/10 bg-white/95 text-ink shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-2 border-b border-ink/8 px-3.5 pb-2.5 pt-3 pr-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            {vehicle.isReal ? 'Tesla · Live' : 'Fleet vehicle'}
          </p>
          <h3 className="mt-0.5 truncate text-base font-semibold tracking-tight text-ink">{name}</h3>
        </div>
        <span
          className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="space-y-2.5 px-3.5 py-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-ink/8 bg-surface px-2.5 py-1.5">
            <p className="text-[10px] text-ink-subtle">Battery</p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-ink">{battery != null ? `${battery}%` : '—'}</p>
          </div>
          <div className="rounded-lg border border-ink/8 bg-surface px-2.5 py-1.5">
            <p className="text-[10px] text-ink-subtle">Health</p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-ink">{health}<span className="text-[10px] text-ink-subtle">/100</span></p>
          </div>
        </div>

        <div className="space-y-1.5">
          <MetricRow label={vehicle.city ? 'Location' : 'Assignment'} value={vehicle.city || vehicle.assignment || 'Fleet vehicle'} />
          {vehicle.isReal
            ? <MetricRow label="Charging" value={vehicle.chargingState || 'Idle'} />
            : <MetricRow label="Profit" value={`${Math.round(Number(vehicle.profitability) || 0)}%`} />}
          {Number.isFinite(intel?.baseMiles) && (
            <MetricRow label="From base" value={formatMiles(intel.baseMiles)} />
          )}
          {vehicle.isReal && vehicle.vin && <MetricRow label="VIN" value={maskVin(vehicle.vin)} />}
        </div>

        {chargeTarget && (
          <div className="rounded-lg border border-status-caution/20 bg-status-caution/[0.08] px-2.5 py-1.5 text-[11px]">
            <p className="flex items-center gap-1 font-medium text-ink">
              <Zap className="h-3 w-3 text-status-caution" /> Nearest charge
            </p>
            <p className="mt-0.5 truncate text-ink-muted">
              {chargeTarget.name} · {formatMiles(intel.nearestStation.miles)} · {chargeTarget.occupancy}% busy
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-0.5">
          {onShowDetail && (
            <button
              type="button"
              onClick={() => onShowDetail(vehicle)}
              className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
            >
              Show detail
            </button>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!repositionTarget || !onQueueCommand}
              onClick={() => onQueueCommand?.(
                `Reposition ${name} toward the ${repositionTarget.name} demand corridor (${repositionTarget.profitability}% profitability)`,
                'NORMAL',
              )}
              className="rounded-lg border border-ink/12 bg-surface-raised px-2 py-2 text-[11px] font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Queue rebalance
            </button>
            <button
              type="button"
              disabled={!chargeTarget || !onQueueCommand}
              onClick={() => onQueueCommand?.(
                `Send ${name} to ${chargeTarget.name} for charging (${formatMiles(intel.nearestStation.miles)} away)`,
                'HIGH',
              )}
              className="rounded-lg border border-ink/12 bg-surface-raised px-2 py-2 text-[11px] font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Queue charge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingTokenState() {
  return (
    <div className="relative flex h-[70vh] min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-surface-raised lg:h-[calc(100vh-8rem)]">
      <div className="mx-6 max-w-sm rounded-2xl border border-ink/10 bg-white/90 p-6 text-center shadow-sm backdrop-blur animate-fade-up">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <MapPin className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-ink">Map needs a Mapbox token</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Add <code className="rounded bg-ink/5 px-1 py-0.5 text-[12px] text-ink">VITE_MAPBOX_TOKEN</code> to your environment to
          render live vehicle positions, demand corridors, and charging hubs.
        </p>
      </div>
    </div>
  );
}

export default function FleetMap({
  fleet = [],
  selectedVehicle,
  setSelectedVehicle,
  weatherZones = [],
  demandZones = [],
  chargingStations = [],
  onQueueCommand,
  onShowDetail,
}) {
  const mapRef = useRef(null);
  const [mapTheme, setMapTheme] = useState('dark');
  const [showLayers, setShowLayers] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [layers, setLayers] = useState({
    vehicles: true,
    demand: true,
    charging: false,
    weather: false,
    routes: false,
    heatmap: false,
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const realVehicle = fleet.find((vehicle) => vehicle.isReal && vehicle.latitude && vehicle.longitude);

  const mapStyle = mapTheme === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/dark-v11';

  const counts = useMemo(() => {
    const base = { ready: 0, active: 0, charging: 0, attention: 0 };
    fleet.forEach((vehicle) => { base[statusKey(vehicle)] += 1; });
    return base;
  }, [fleet]);

  const selectedIntel = useMemo(
    () => buildVehicleIntel(selectedVehicle, { chargingStations, demandZones }),
    [selectedVehicle, chargingStations, demandZones],
  );

  const toggleLayer = (key) => setLayers((current) => ({ ...current, [key]: !current[key] }));

  useEffect(() => {
    if (!realVehicle || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [realVehicle.longitude, realVehicle.latitude],
      zoom: 11,
      duration: 900,
      essential: true,
    });
  }, [realVehicle]);

  const recenter = () => {
    if (!mapRef.current) return;
    const located = fleet.filter((vehicle) => Number.isFinite(Number(vehicle.latitude)));
    if (realVehicle) {
      mapRef.current.flyTo({ center: [realVehicle.longitude, realVehicle.latitude], zoom: 11, duration: 800, essential: true });
      return;
    }
    if (!located.length) return;
    const avgLng = located.reduce((sum, v) => sum + Number(v.longitude), 0) / located.length;
    const avgLat = located.reduce((sum, v) => sum + Number(v.latitude), 0) / located.length;
    mapRef.current.flyTo({ center: [avgLng, avgLat], zoom: 6, duration: 800, essential: true });
  };

  if (!mapboxToken) {
    return <MissingTokenState />;
  }

  const hasVehicles = fleet.length > 0;

  return (
    <div className="relative h-[70vh] min-h-[460px] w-full overflow-hidden rounded-2xl border border-ink/10 bg-slate-950 shadow-sm lg:h-[calc(100vh-8rem)]">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{ longitude: -81.7, latitude: 27.8, zoom: 5.8 }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onClick={() => { setSelectedVehicle(null); setSelectedStation(null); }}
      >
        {layers.heatmap && <HeatmapLayer heatmapData={heatmapData} />}

        {layers.weather && weatherZones.map((zone) => (
          <Marker key={zone.id} longitude={zone.longitude} latitude={zone.latitude}>
            <div
              className="pointer-events-none rounded-full opacity-25"
              style={{
                width: `${zone.radius}px`,
                height: `${zone.radius}px`,
                background: zone.severity === 'CRITICAL' ? '#dc2626' : zone.severity === 'HIGH' ? '#ef4444' : '#f59e0b',
                filter: 'blur(45px)',
              }}
            />
          </Marker>
        ))}

        {layers.demand && demandZones.map((zone) => (
          <Marker key={`demand-${zone.name}`} longitude={zone.longitude} latitude={zone.latitude}>
            <div className="pointer-events-none relative flex items-center justify-center">
              <div
                className="rounded-full opacity-25"
                style={{ width: `${zone.radius}px`, height: `${zone.radius}px`, background: zone.color, filter: 'blur(28px)' }}
              />
              <span className="absolute whitespace-nowrap rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {zone.name} · {zone.demand}%
              </span>
            </div>
          </Marker>
        ))}

        {layers.routes && fleet.filter((vehicle) => !vehicle.isReal && Number.isFinite(Number(vehicle.targetLat))).map((vehicle) => (
          <Source key={`route-${vehicle.id}`} id={`route-${vehicle.id}`} type="geojson" data={vehicleRoute(vehicle)}>
            <Layer
              id={`line-${vehicle.id}`}
              type="line"
              paint={{
                'line-color': statusKey(vehicle) === 'attention' ? '#ef4444' : '#0ea5e9',
                'line-width': 2,
                'line-opacity': 0.5,
              }}
            />
          </Source>
        ))}

        {layers.charging && chargingStations.map((station) => (
          <Marker
            key={station.id}
            longitude={station.longitude}
            latitude={station.latitude}
            onClick={(event) => { event.originalEvent.stopPropagation(); setSelectedStation(station); }}
          >
            <button
              type="button"
              className="flex h-7 w-7 -translate-y-1 items-center justify-center rounded-lg border-2 border-white bg-status-ready text-white shadow-[0_0_14px_rgba(16,185,129,0.7)] transition hover:scale-110"
              aria-label={`Charging hub ${station.name}`}
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
          </Marker>
        ))}

        {layers.vehicles && fleet.map((vehicle) => {
          const key = statusKey(vehicle);
          const status = STATUS[key];
          const isSelected = selectedVehicle?.id === vehicle.id;
          const battery = Number.isFinite(Number(vehicle.battery)) ? Math.round(Number(vehicle.battery)) : null;
          const size = isSelected ? 22 : vehicle.isReal ? 20 : 16;
          return (
            <Marker
              key={vehicle.id}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              style={{ zIndex: isSelected ? 60 : vehicle.isReal ? 50 : 20 }}
            >
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); setSelectedVehicle(vehicle); setSelectedStation(null); }}
                onMouseDown={(event) => event.stopPropagation()}
                className="group flex -translate-y-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-1"
                aria-label={`Select ${vehicleName(vehicle)}`}
              >
                <span
                  className={`relative block rounded-full transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    background: status.color,
                    border: `${isSelected ? 3 : 2}px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)'}`,
                    boxShadow: `0 0 0 ${isSelected ? 4 : 0}px ${status.color}33, 0 0 16px ${status.color}cc`,
                  }}
                >
                  {key === 'attention' && (
                    <span className="absolute inset-0 animate-ping rounded-full" style={{ background: `${status.color}66` }} aria-hidden="true" />
                  )}
                </span>
                {(isSelected || vehicle.isReal) && (
                  <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur">
                    {vehicleName(vehicle)}{battery != null ? ` · ${battery}%` : ''}
                  </span>
                )}
              </button>
            </Marker>
          );
        })}

        {selectedStation && (
          <Popup
            longitude={selectedStation.longitude}
            latitude={selectedStation.latitude}
            className="fleetos-popup"
            closeButton
            closeOnClick={false}
            onClose={() => setSelectedStation(null)}
            anchor="top"
            offset={16}
          >
            <div className="w-[200px] rounded-2xl border border-ink/10 bg-white/95 p-3.5 text-ink shadow-xl backdrop-blur">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-ready">
                <Zap className="h-3 w-3" /> Charging hub
              </p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{selectedStation.name}</h3>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <MetricRow label="Occupancy" value={`${selectedStation.occupancy}%`} />
                <MetricRow label="Energy cost" value={`$${selectedStation.energyCost}/kWh`} />
              </div>
            </div>
          </Popup>
        )}

        {selectedVehicle && layers.vehicles && Number.isFinite(Number(selectedVehicle.latitude)) && (
          <Popup
            longitude={selectedVehicle.longitude}
            latitude={selectedVehicle.latitude}
            className="fleetos-popup"
            closeButton
            closeOnClick={false}
            onClose={() => setSelectedVehicle(null)}
            anchor="top"
            offset={20}
          >
            <VehiclePopupCard
              vehicle={selectedVehicle}
              intel={selectedIntel}
              onShowDetail={onShowDetail}
              onQueueCommand={onQueueCommand}
            />
          </Popup>
        )}
      </Map>

      {/* Top-left: title + status legend */}
      <div className="pointer-events-none absolute left-3 top-3 right-3 flex flex-wrap items-start gap-2 sm:left-4 sm:top-4 sm:right-auto">
        <div className="pointer-events-auto rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md animate-fade-up">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Live fleet</p>
          <p className="text-sm font-semibold tracking-tight text-ink">Command map</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
            {STATUS_ORDER.map((key) => (
              <StatChip
                key={key}
                tone={STATUS[key].tone}
                color={STATUS[key].color}
                label={STATUS[key].label}
                count={counts[key]}
                active={layers.vehicles}
                onClick={() => setLayers((current) => ({ ...current, vehicles: true }))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom-right: floating controls (thumb reachable) */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2 sm:bottom-4 sm:right-4">
        {showLayers && (
          <div className="w-60 rounded-2xl border border-ink/10 bg-white/92 p-3 shadow-lg backdrop-blur-md animate-fade-up">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Layers</p>
            <div className="space-y-1.5">
              <LayerToggle label="Vehicles" hint={`${fleet.length} tracked`} checked={layers.vehicles} onChange={() => toggleLayer('vehicles')} accent="#0ea5e9" />
              <LayerToggle label="Demand zones" hint={`${demandZones.length} corridors`} checked={layers.demand} onChange={() => toggleLayer('demand')} accent="#a855f7" disabled={!demandZones.length} />
              <LayerToggle label="Charging hubs" hint={`${chargingStations.length} stations`} checked={layers.charging} onChange={() => toggleLayer('charging')} accent="#10b981" disabled={!chargingStations.length} />
              <LayerToggle label="Demand heatmap" hint={`${heatmapData.length} hotspots`} checked={layers.heatmap} onChange={() => toggleLayer('heatmap')} accent="#ec4899" />
              <LayerToggle label="Weather / traffic" hint={`${weatherZones.length} alerts`} checked={layers.weather} onChange={() => toggleLayer('weather')} accent="#f59e0b" disabled={!weatherZones.length} />
              <LayerToggle label="Sim routes" hint="Repositioning paths" checked={layers.routes} onChange={() => toggleLayer('routes')} accent="#64748b" />
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-ink/8 pt-2.5">
              {[['dark', 'Ops'], ['satellite', 'Satellite']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMapTheme(value)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                    mapTheme === value ? 'bg-accent text-white' : 'bg-ink/[0.04] text-ink-muted hover:bg-ink/[0.07]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recenter}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/92 text-ink shadow-lg backdrop-blur-md transition hover:bg-white"
            aria-label="Recenter map"
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowLayers((current) => !current)}
            className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-lg backdrop-blur-md transition ${
              showLayers ? 'border-accent bg-accent text-white' : 'border-ink/10 bg-white/92 text-ink hover:bg-white'
            }`}
            aria-expanded={showLayers}
          >
            <span className="inline-flex flex-col gap-[2px]" aria-hidden="true">
              <span className="h-[2px] w-4 rounded-full bg-current" />
              <span className="h-[2px] w-4 rounded-full bg-current opacity-70" />
              <span className="h-[2px] w-4 rounded-full bg-current opacity-40" />
            </span>
            Layers
          </button>
        </div>
      </div>

      {/* Bottom-left: selected vehicle intelligence card */}
      {selectedVehicle && selectedIntel && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-0 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[300px]">
          <div className="pointer-events-auto rounded-2xl border border-ink/10 bg-white/92 p-3.5 shadow-lg backdrop-blur-md animate-fade-up">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                <Gauge className="h-3 w-3" /> Location intelligence
              </p>
              <span className="truncate text-xs font-semibold text-ink">{vehicleName(selectedVehicle)}</span>
            </div>

            <div className="mt-2.5 space-y-2">
              {selectedIntel.bestZone && (
                <div className="flex items-start gap-2 rounded-xl border border-ink/8 bg-surface px-2.5 py-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-active" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">Reposition → {selectedIntel.bestZone.zone.name}</p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatMiles(selectedIntel.bestZone.miles)} away · {selectedIntel.bestZone.zone.profitability}% profitability
                    </p>
                  </div>
                </div>
              )}
              {selectedIntel.nearestStation && (
                <div className="flex items-start gap-2 rounded-xl border border-ink/8 bg-surface px-2.5 py-2">
                  <BatteryCharging className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ready" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">Nearest charge · {selectedIntel.nearestStation.station.name}</p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatMiles(selectedIntel.nearestStation.miles)} away · {selectedIntel.nearestStation.station.occupancy}% busy
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {!hasVehicles && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto mx-6 max-w-xs rounded-2xl border border-ink/10 bg-white/92 p-5 text-center shadow-lg backdrop-blur animate-fade-up">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
              <Navigation className="h-4 w-4" />
            </div>
            <h3 className="mt-2.5 text-sm font-semibold text-ink">No vehicles to plot yet</h3>
            <p className="mt-1 text-xs text-ink-muted">Connect a Tesla or wait for the simulation fleet to come online.</p>
          </div>
        </div>
      )}
    </div>
  );
}
