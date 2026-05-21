import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/mapbox';
import HeatmapLayer from './HeatmapLayer';
import heatmapData from '../data/heatmapData';

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

function formatValue(value, fallback = 'Unavailable') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function MetricRow({ label, value, emphasize = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={emphasize ? 'font-black text-slate-950' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  );
}

function VehiclePopup({ vehicle }) {
  if (vehicle.isReal) {
    return (
      <div className="w-[280px] overflow-hidden rounded-2xl bg-white text-slate-950 shadow-2xl">
        <div className="bg-slate-950 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-green-300">Tesla Telemetry</p>
              <h3 className="mt-1 text-xl font-black">{vehicle.name || vehicle.display_name || 'My Tesla'}</h3>
            </div>
            <span className="rounded-full bg-green-400 px-2 py-1 text-[10px] font-black text-slate-950">
              {formatValue(vehicle.status)}
            </span>
          </div>
          {vehicle.vin && <p className="mt-2 text-[10px] text-slate-400">{vehicle.vin}</p>}
        </div>

        <div className="space-y-3 p-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-slate-500">Battery</p>
              <p className="mt-1 text-2xl font-black">
                {Number.isFinite(vehicle.battery) ? `${Math.round(vehicle.battery)}%` : '--'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-slate-500">Speed</p>
              <p className="mt-1 text-2xl font-black">{vehicle.speed || 0}<span className="text-xs"> mph</span></p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <MetricRow label="Charging" value={formatValue(vehicle.chargingState)} />
            <MetricRow
              label="Odometer"
              value={vehicle.odometer !== undefined ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : 'Unavailable'}
            />
            <MetricRow label="Software" value={formatValue(vehicle.softwareVersion)} />
            <MetricRow label="Locked" value={vehicle.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'} />
            <MetricRow label="Service Mode" value={vehicle.serviceMode ? 'On' : 'Off'} />
          </div>

          <div className="rounded-xl bg-green-50 p-3 text-green-950">
            <p className="font-black">Current State</p>
            <p className="mt-1">{vehicle.assignment || 'Synced Tesla telemetry'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[260px] rounded-2xl bg-white p-4 text-xs text-slate-950 shadow-2xl">
      <h3 className="text-lg font-black">{vehicle.id}</h3>
      <p className="mb-3 text-slate-500">{vehicle.city || 'Fleet vehicle'}</p>

      <div className="space-y-2">
        <MetricRow label="Status" value={vehicle.status} emphasize />
        <MetricRow label="Battery" value={`${Math.round(vehicle.battery)}%`} />
        <MetricRow label="Profitability" value={`${Math.round(vehicle.profitability)}%`} />
        <MetricRow label="Anomaly Risk" value={`${Math.round(vehicle.anomalyRisk)}%`} />
        <MetricRow label="Maintenance" value={`${Math.round(vehicle.maintenanceScore)}%`} />
        <MetricRow label="Passengers" value={vehicle.passengers} />
        <MetricRow label="Efficiency" value={`${vehicle.efficiency}%`} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-100 p-3">
        <p className="font-black">Current Assignment</p>
        <p className="mt-1">{vehicle.assignment}</p>
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
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] overflow-hidden">
        <div className="h-[900px] flex items-center justify-center text-slate-400">
          Add VITE_MAPBOX_TOKEN to render the live fleet map.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] overflow-hidden">
      <div className="h-[900px]">
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -81.7,
            latitude: 27.8,
            zoom: 5.8,
          }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <HeatmapLayer heatmapData={heatmapData} />

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

          {fleet.map((vehicle) => (
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

          {demandZones.map((zone) => (
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
                <span
                  className={`block rounded-full border-4 shadow-[0_0_24px] ${
                    vehicle.anomalyRisk > 20
                      ? 'h-6 w-6 bg-red-500 border-red-200 shadow-red-500'
                      : vehicle.battery < 30
                        ? 'h-6 w-6 bg-yellow-400 border-yellow-200 shadow-yellow-400'
                        : vehicle.isReal
                          ? 'h-8 w-8 bg-green-400 border-green-100 shadow-green-400'
                          : 'h-6 w-6 bg-cyan-400 border-cyan-200 shadow-cyan-400'
                  }`}
                />
                {vehicle.isReal && (
                  <span className="rounded-full border border-green-300/40 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-green-200 shadow-lg">
                    {vehicle.name || vehicle.display_name || 'TESLA'}
                  </span>
                )}
              </div>
            </Marker>
          ))}

          {selectedVehicle && (
            <Popup
              longitude={selectedVehicle.longitude}
              latitude={selectedVehicle.latitude}
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedVehicle(null)}
              anchor="top"
            >
              <VehiclePopup vehicle={selectedVehicle} />
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
