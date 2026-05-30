import { useEffect, useRef, useState } from 'react';
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from './HeatmapLayer';
import heatmapData from '../data/heatmapData';
import { maskVin } from '../utils/vinPrivacy';

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

function vehicleName(vehicle) {
  return vehicle?.ownership?.tag || vehicle?.name || vehicle?.display_name || vehicle?.id || 'Tesla';
}

function getVehicleStatus(vehicle) {
  const raw = String(vehicle.status || vehicle.state || '').toLowerCase();
  const charging = String(vehicle.chargingState || '').toLowerCase();
  const battery = Number(vehicle.battery);
  const health = Number(vehicle.maintenanceScore ?? vehicle.healthScore ?? 88);
  const anomaly = Number(vehicle.anomalyRisk || 0);

  if (anomaly > 20 || health < 72 || (Number.isFinite(battery) && battery < 25)) {
    return {
      label: 'Needs Attention',
      shortLabel: 'Attention',
      tone: 'red',
      pin: 'bg-red-500 border-red-100 shadow-red-500',
      badge: 'border-red-300/30 bg-red-400/15 text-red-100',
    };
  }

  if (charging.includes('charging') || charging.includes('plugged')) {
    return {
      label: 'Charging',
      shortLabel: 'Charging',
      tone: 'orange',
      pin: 'bg-orange-400 border-orange-100 shadow-orange-400',
      badge: 'border-orange-300/30 bg-orange-400/15 text-orange-100',
    };
  }

  if (raw.includes('rental') || raw.includes('pickup') || raw.includes('route') || raw.includes('en route') || raw.includes('use')) {
    return {
      label: 'In Rental / In Use',
      shortLabel: 'In Use',
      tone: 'blue',
      pin: 'bg-sky-400 border-sky-100 shadow-sky-400',
      badge: 'border-sky-300/30 bg-sky-400/15 text-sky-100',
    };
  }

  return {
    label: 'Ready / Available',
    shortLabel: 'Ready',
    tone: 'green',
    pin: 'bg-emerald-400 border-emerald-100 shadow-emerald-400',
    badge: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100',
  };
}

function formatValue(value, fallback = 'Unavailable') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function MetricRow({ label, value, emphasize = false }) {
  return (
    <div className="grid grid-cols-[66px_minmax(0,1fr)] items-center gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`${emphasize ? 'font-black text-white' : 'font-semibold text-slate-100'} min-w-0 truncate text-right`}>
        {value}
      </span>
    </div>
  );
}

function HeadingArrow({ heading }) {
  if (!Number.isFinite(Number(heading))) return null;

  return (
    <span
      className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[12px] border-x-transparent border-b-emerald-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]"
      style={{ transform: `translateX(-50%) rotate(${Number(heading)}deg)` }}
      aria-hidden="true"
    />
  );
}

function VehiclePopup({ vehicle }) {
  const status = getVehicleStatus(vehicle);
  const healthScore = Math.round(Number(vehicle.maintenanceScore ?? vehicle.healthScore ?? 88));
  const nextRental = vehicle.nextRental || vehicle.assignment || (vehicle.isReal ? 'Availability depends on owner schedule' : 'Simulated rental window');

  if (vehicle.isReal) {
    return (
      <div className="w-[218px] overflow-hidden rounded-xl border border-emerald-300/20 bg-slate-950/95 text-white backdrop-blur">
        <div className="border-b border-white/10 p-3 pr-9">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300">Tesla</p>
              <h3 className="mt-1 truncate text-xl font-black leading-none">{vehicle.name || vehicle.display_name || 'My Tesla'}</h3>
            </div>
            <span className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black ${status.badge}`}>
              {status.shortLabel}
            </span>
          </div>
          {vehicle.vin && <p className="mt-1.5 truncate text-[9px] text-slate-500">{maskVin(vehicle.vin)}</p>}
        </div>

        <div className="space-y-2.5 p-3 text-[11px]">
          <div className="grid grid-cols-2 gap-2 border-b border-white/10 pb-2.5">
            <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-2">
              <p className="text-[10px] text-slate-400">Battery</p>
              <p className="mt-0.5 text-lg font-black leading-none">
                {Number.isFinite(vehicle.battery) ? `${Math.round(vehicle.battery)}%` : '--'}
              </p>
            </div>
            <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-2">
              <p className="text-[10px] text-slate-400">Speed</p>
              <p className="mt-0.5 text-lg font-black leading-none">
                {vehicle.speed || 0}<span className="ml-0.5 text-[10px] text-slate-400">mph</span>
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <MetricRow label="Charging" value={formatValue(vehicle.chargingState)} />
            <MetricRow
              label="Miles"
              value={vehicle.odometer !== undefined ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : 'Unavailable'}
            />
            <MetricRow label="GPS" value={vehicle.gpsAsOf ? 'Live' : 'Fallback'} />
            <MetricRow label="Health" value={`${healthScore}/100`} />
            <MetricRow label="Locked" value={vehicle.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'} />
          </div>

          <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-2 text-emerald-100">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Next rental / availability</p>
            <p className="mt-1 truncate font-semibold">{nextRental}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[260px] rounded-2xl bg-white p-4 text-xs text-slate-950 shadow-2xl">
      <h3 className="text-lg font-black">{vehicleName(vehicle)}</h3>
      <p className="mb-3 text-slate-500">{vehicle.city || 'Fleet vehicle'}</p>

      <div className="space-y-2">
        <MetricRow label="Status" value={status.label} emphasize />
        <MetricRow label="Battery" value={`${Math.round(vehicle.battery)}%`} />
        <MetricRow label="Profitability" value={`${Math.round(vehicle.profitability)}%`} />
        <MetricRow label="Anomaly Risk" value={`${Math.round(vehicle.anomalyRisk)}%`} />
        <MetricRow label="Health" value={`${healthScore}/100`} />
        <MetricRow label="Passengers" value={vehicle.passengers} />
        <MetricRow label="Efficiency" value={`${vehicle.efficiency}%`} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-100 p-3">
        <p className="font-black">Next rental / availability</p>
        <p className="mt-1">{nextRental}</p>
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
}) {
  const mapRef = useRef(null);
  const [mapTheme, setMapTheme] = useState('dark');
  const [showMarketLayers, setShowMarketLayers] = useState(false);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const realVehicle = fleet.find((vehicle) => vehicle.isReal && vehicle.latitude && vehicle.longitude);
  const mapStyle = mapTheme === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/dark-v11';

  useEffect(() => {
    if (!realVehicle || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [realVehicle.longitude, realVehicle.latitude],
      zoom: 11,
      duration: 900,
      essential: true,
    });
  }, [realVehicle]);

  if (!mapboxToken) {
    return (
      <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex h-[430px] items-center justify-center text-slate-400 sm:h-[520px] lg:h-[900px]">
          Add VITE_MAPBOX_TOKEN to render the live fleet map.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">My Vehicle Map</p>
          <p className="mt-1 text-sm text-slate-400">Your Teslas first: status, battery, health, GPS, and next rental context.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-white/10 bg-white/[0.04] p-1">
            {[
              ['dark', 'Ops'],
              ['satellite', 'Satellite'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMapTheme(value)}
                className={`rounded px-3 py-2 text-xs font-black transition ${
                  mapTheme === value
                    ? 'bg-sky-300 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowMarketLayers((current) => !current)}
            className={`rounded-md border px-3 py-2 text-xs font-black transition ${
              showMarketLayers
                ? 'border-violet-300/30 bg-violet-300/15 text-violet-100'
                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
            }`}
          >
            {showMarketLayers ? 'Hide service areas' : 'Show service areas'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-white/10 bg-slate-950/60 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] sm:grid-cols-4">
        {[
          ['Ready / Available', 'bg-emerald-400'],
          ['In Rental / In Use', 'bg-sky-400'],
          ['Charging', 'bg-orange-400'],
          ['Needs Attention', 'bg-red-500'],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-slate-300">
            <span className={`h-3 w-3 rounded-full ${color} shadow-[0_0_12px_currentColor]`} />
            {label}
          </div>
        ))}
      </div>
      <div className="h-[430px] sm:h-[520px] lg:h-[900px]">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -81.7,
            latitude: 27.8,
            zoom: 5.8,
          }}
          mapStyle={mapStyle}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {showMarketLayers && <HeatmapLayer heatmapData={heatmapData} />}

          {weatherZones.map((zone) => (
            <Marker key={zone.id} longitude={zone.longitude} latitude={zone.latitude}>
              <div
                className={`pointer-events-none rounded-full opacity-25 animate-pulse ${
                  zone.severity === 'CRITICAL'
                    ? 'bg-red-600'
                    : zone.severity === 'HIGH'
                      ? 'bg-red-500'
                      : 'bg-yellow-400'
                }`}
                style={{
                  width: `${zone.radius}px`,
                  height: `${zone.radius}px`,
                  filter: 'blur(45px)',
                }}
              />
            </Marker>
          ))}

          {showMarketLayers && fleet.filter((vehicle) => !vehicle.isReal).map((vehicle) => (
            <Source key={`route-${vehicle.id}`} id={`route-${vehicle.id}`} type="geojson" data={vehicleRoute(vehicle)}>
              <Layer
                id={`line-${vehicle.id}`}
                type="line"
                paint={{
                  'line-color': vehicle.anomalyRisk > 20 ? '#ef4444' : '#22d3ee',
                  'line-width': 2,
                  'line-opacity': 0.45,
                }}
              />
            </Source>
          ))}

          {showMarketLayers && demandZones.map((zone) => (
            <Marker key={zone.name} longitude={zone.longitude} latitude={zone.latitude}>
              <div
                className="pointer-events-none rounded-full animate-pulse opacity-20"
                style={{
                  width: `${zone.radius}px`,
                  height: `${zone.radius}px`,
                  background: zone.color,
                  filter: 'blur(30px)',
                }}
              />
            </Marker>
          ))}

          {chargingStations.map((station) => (
            <Marker key={station.id} longitude={station.longitude} latitude={station.latitude}>
              <div className="flex flex-col items-center">
                <div className="h-5 w-5 rounded-full bg-green-400 border-4 border-green-200 shadow-[0_0_20px_#4ade80]" />
              </div>
            </Marker>
          ))}

          {fleet.map((vehicle) => (
            <Marker
              key={vehicle.id}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              style={{ zIndex: vehicle.isReal ? 50 : 20 }}
            >
              <div
                role="button"
                tabIndex={0}
                className="pointer-events-auto flex -translate-y-2 flex-col items-center gap-1 rounded-full p-3"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedVehicle(vehicle);
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedVehicle(vehicle);
                  }
                }}
                aria-label={`Select ${vehicle.id}`}
              >
                {(() => {
                  const status = getVehicleStatus(vehicle);
                  return (
                    <>
                <span
                  className={`relative block rounded-full border-4 shadow-[0_0_24px] ${vehicle.isReal ? 'h-8 w-8' : 'h-6 w-6'} ${status.pin}`}
                >
                  {vehicle.isReal && <HeadingArrow heading={vehicle.heading} />}
                </span>
                {vehicle.isReal ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`rounded-full border bg-black/80 px-2 py-0.5 text-[10px] font-bold shadow-lg ${status.badge}`}>
                      {vehicleName(vehicle)}
                    </span>
                    <span className="rounded-full bg-slate-950/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-200">
                      {status.shortLabel}
                    </span>
                  </div>
                ) : (
                  <span className={`rounded-full border bg-black/80 px-2 py-0.5 text-[9px] font-bold shadow-lg ${status.badge}`}>
                    {vehicleName(vehicle)}
                  </span>
                )}
                    </>
                  );
                })()}
              </div>
            </Marker>
          ))}

          {selectedVehicle && (
            <Popup
              longitude={selectedVehicle.longitude}
              latitude={selectedVehicle.latitude}
              className="fleetos-popup"
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedVehicle(null)}
              anchor="top"
              offset={18}
            >
              <VehiclePopup vehicle={selectedVehicle} />
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
