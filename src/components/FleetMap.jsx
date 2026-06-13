import React, { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeatmapLayer from './HeatmapLayer';
import heatmapData from '../data/heatmapData';

function getVehicleName(vehicle) {
  if (!vehicle) return 'Vehicle';
  return vehicle.name || vehicle.ownership?.tag || vehicle.display_name || vehicle.id || 'Tesla';
}

function getMarkerColor(vehicle) {
  const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  // Treat most active/ready states as online (emerald). Fallback to amber for charging/attention/etc.
  if (status.includes('ONLINE') || status.includes('READY') || status.includes('EN ROUTE') || status.includes('PICKUP') || status.includes('REPOSITION') || status.includes('IDLE')) {
    return 'bg-emerald-500';
  }
  return 'bg-amber-500';
}

function getEarningsDisplay(vehicle) {
  const raw = Number(vehicle?.earnings ?? vehicle?.revenue ?? 0);
  if (vehicle?.isReal) {
    // Real Tesla vehicles show actual tracked revenue — never a fabricated figure.
    return Math.max(0, Math.round(raw));
  }
  // Demo vehicles show a modeled "today" figure (simulation revenue is cumulative-style)
  return Math.max(180, Math.round(raw / 12));
}

export default function FleetMap({ fleet = [], onShowDetail }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Default center: Orlando area (matches the realistic robotaxi metro focus)
  const [viewState, setViewState] = useState({
    longitude: -81.3792,
    latitude: 28.5383,
    zoom: 10,
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const onlineCount = fleet.filter((v) => {
    const st = String(v?.status || v?.state || '').toUpperCase();
    const batt = Number(v?.battery);
    return !st.includes('OFFLINE') && (!Number.isFinite(batt) || batt > 8);
  }).length || fleet.length;

  if (!mapboxToken) {
    return (
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white">Live Vehicles</h2>
        </div>
        <div className="h-[560px] flex items-center justify-center text-white/70 bg-[#0a0f1a]">
          <div className="text-center max-w-xs px-6">
            <div className="text-4xl mb-3">🗺️</div>
            <div className="font-medium mb-1">Mapbox token required</div>
            <div className="text-sm text-white/50">Add <code className="bg-white/10 px-1 py-0.5 rounded">VITE_MAPBOX_TOKEN</code> to enable the live map.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Live Vehicles</h2>
        <div className="text-emerald-400 text-sm font-medium">{onlineCount} Online • Orlando Metro</div>
      </div>

      <div className="h-[560px] relative">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
          style={{ width: '100%', height: '100%' }}
          onClick={() => setSelectedVehicle(null)}
        >
          <HeatmapLayer heatmapData={heatmapData} />
          {fleet.map((vehicle) => {
            const lng = Number(vehicle?.longitude);
            const lat = Number(vehicle?.latitude);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

            const name = getVehicleName(vehicle);

            return (
              <Marker
                key={vehicle.id || name}
                longitude={lng}
                latitude={lat}
                onClick={(e) => {
                  e.originalEvent?.stopPropagation?.();
                  setSelectedVehicle(vehicle);
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white cursor-pointer transition hover:scale-125 ${getMarkerColor(vehicle)}`}
                  title={name}
                />
              </Marker>
            );
          })}

          {selectedVehicle && Number.isFinite(Number(selectedVehicle.longitude)) && Number.isFinite(Number(selectedVehicle.latitude)) && (
            <Popup
              longitude={Number(selectedVehicle.longitude)}
              latitude={Number(selectedVehicle.latitude)}
              onClose={() => setSelectedVehicle(null)}
              closeButton
              closeOnClick={false}
              anchor="top"
              offset={14}
            >
              <div className="min-w-[248px] p-3 bg-white text-[#111] rounded-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-[17px] tracking-[-0.2px]">{getVehicleName(selectedVehicle)}</div>
                  {!selectedVehicle.isReal && (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-black/60">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="text-emerald-600 text-sm mt-0.5">
                  ● {selectedVehicle.status || selectedVehicle.state || 'ONLINE'} • {Math.round(Number(selectedVehicle.battery) || 0)}% battery
                </div>

                <div className="mt-3 text-sm text-black/70">
                  ${getEarningsDisplay(selectedVehicle)} {selectedVehicle.isReal ? 'earned today' : 'demo earnings'}
                </div>

                <button
                  onClick={() => {
                    const v = selectedVehicle;
                    setSelectedVehicle(null);
                    if (typeof onShowDetail === 'function') {
                      onShowDetail(v);
                    }
                  }}
                  className="mt-4 w-full bg-black active:bg-zinc-900 text-white py-2.5 rounded-2xl text-sm font-semibold transition"
                >
                  View Details
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
