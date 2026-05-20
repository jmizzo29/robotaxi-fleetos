import Map, {
  Marker,
  Source,
  Layer,
  Popup
} from 'react-map-gl/mapbox'

import HeatmapLayer from './HeatmapLayer'

import heatmapData from '../data/heatmapData'

export default function FleetMap({
  fleet,
  selectedVehicle,
  setSelectedVehicle,
  weatherZones,
  demandZones,
  chargingStations
}) {

  return (

    <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] overflow-hidden">

      <div className="h-[900px]">

        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          initialViewState={{
            longitude: -81.7,
            latitude: 27.8,
            zoom: 5.8
          }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{
            width: '100%',
            height: '100%'
          }}
        >

          {/* =====================================================
              HEATMAP LAYER
          ====================================================== */}

          <HeatmapLayer
            heatmapData={heatmapData}
          />

          {/* =====================================================
              WEATHER ZONES
          ====================================================== */}

          {weatherZones.map((zone) => (
            <Marker
              key={zone.id}
              longitude={zone.longitude}
              latitude={zone.latitude}
            >

              <div
                className={`rounded-full opacity-25 animate-pulse ${
                  zone.severity === 'CRITICAL'
                    ? 'bg-red-600'
                    : zone.severity === 'HIGH'
                    ? 'bg-red-500'
                    : 'bg-yellow-400'
                }`}
                style={{
                  width: `${zone.radius}px`,
                  height: `${zone.radius}px`,
                  filter: 'blur(45px)'
                }}
              />

            </Marker>
          ))}

          {/* =====================================================
              ROUTE LINES
          ====================================================== */}

          {fleet.map((vehicle) => (

            <Source
              key={`route-${vehicle.id}`}
              type="geojson"
              data={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [vehicle.longitude, vehicle.latitude],
                    [vehicle.targetLng, vehicle.targetLat]
                  ]
                }
              }}
            >

              <Layer
                id={`line-${vehicle.id}`}
                type="line"
                paint={{
                  'line-color':
                    vehicle.anomalyRisk > 20
                      ? '#ef4444'
                      : '#22d3ee',

                  'line-width': 2,

                  'line-opacity': 0.45
                }}
              />

            </Source>

          ))}

          {/* =====================================================
              DEMAND ZONES
          ====================================================== */}

          {demandZones.map((zone) => (
            <Marker
              key={zone.name}
              longitude={zone.longitude}
              latitude={zone.latitude}
            >

              <div
                className="rounded-full animate-pulse opacity-20"
                style={{
                  width: `${zone.radius}px`,
                  height: `${zone.radius}px`,
                  background: zone.color,
                  filter: 'blur(30px)'
                }}
              />

            </Marker>
          ))}

          {/* =====================================================
              CHARGING STATIONS
          ====================================================== */}

          {chargingStations.map((station) => (
            <Marker
              key={station.id}
              longitude={station.longitude}
              latitude={station.latitude}
            >

              <div className="flex flex-col items-center">

                <div className="h-5 w-5 rounded-full bg-green-400 border-4 border-green-200 shadow-[0_0_20px_#4ade80]"></div>

              </div>

            </Marker>

          ))}

          {/* =====================================================
              VEHICLES
          ====================================================== */}

          {fleet.map((vehicle) => (
            <Marker
              key={vehicle.id}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
            >

              <div
                className="cursor-pointer"
                onClick={() => setSelectedVehicle(vehicle)}
              >

                <div
                  className={`h-5 w-5 rounded-full border-4 shadow-[0_0_20px]
                    ${
                      vehicle.anomalyRisk > 20
                        ? 'bg-red-500 border-red-200 shadow-red-500'
                        : vehicle.battery < 30
                        ? 'bg-yellow-400 border-yellow-200 shadow-yellow-400'
                        : 'bg-cyan-400 border-cyan-200 shadow-cyan-400'
                    }`}
                ></div>

              </div>

            </Marker>
          ))}

          {/* =====================================================
              VEHICLE POPUP
          ====================================================== */}

          {selectedVehicle && (
            <Popup
              longitude={selectedVehicle.longitude}
              latitude={selectedVehicle.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="top"
            >

              <div className="text-black p-1 min-w-[240px]">

                <h3 className="font-bold mb-3">
                  {selectedVehicle.id}
                </h3>

                <div className="space-y-2 text-xs">

                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="font-bold">
                      {selectedVehicle.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Battery</span>
                    <span>
                      {Math.round(selectedVehicle.battery)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Profitability</span>
                    <span>
                      {Math.round(selectedVehicle.profitability)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Anomaly Risk</span>
                    <span>
                      {Math.round(selectedVehicle.anomalyRisk)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Maintenance</span>
                    <span>
                      {Math.round(selectedVehicle.maintenanceScore)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Passengers</span>
                    <span>
                      {selectedVehicle.passengers}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Efficiency</span>
                    <span>
                      {selectedVehicle.efficiency}%
                    </span>
                  </div>

                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-100 text-xs">

                  <p className="font-bold mb-1">
                    Current Assignment
                  </p>

                  <p>
                    {selectedVehicle.assignment}
                  </p>

                </div>

              </div>

            </Popup>
          )}

        </Map>

      </div>

    </div>
  )
}