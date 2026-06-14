import { useMemo } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { monument, monumentType } from './monumentTokens';
import { vehicleStateLabel } from '../../utils/vehicleDisplayUtils';

const ORLANDO_VIEW = {
  longitude: -81.3792,
  latitude: 28.5383,
  zoom: 11,
};

function markerColor(vehicle) {
  const state = vehicleStateLabel(vehicle);
  if (state === 'Offline' || state === 'Asleep') return '#ef4444';
  if (state === 'Charging') return '#eab308';
  return '#22c55e';
}

export default function AssetPositionMap({
  vehicle,
  cab,
  positionLabel,
  heightClass = 'h-[132px]',
}) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const lat = Number(vehicle?.latitude);
  const lng = Number(vehicle?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const viewState = useMemo(() => (
    hasCoords
      ? { longitude: lng, latitude: lat, zoom: 13 }
      : ORLANDO_VIEW
  ), [hasCoords, lat, lng]);

  if (!hasCoords || !mapboxToken) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl ${heightClass}`}
        style={{ backgroundColor: monument.ledgerWash }}
      >
        <MapPin className="h-4 w-4" style={{ color: monument.inkGhost }} strokeWidth={1.75} />
        <span className={`mt-2 px-4 text-center ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
          {positionLabel || 'Position pending sync'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${heightClass}`} style={{ borderColor: monument.hairline }}>
      <Map
        {...viewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
        interactive={false}
        dragPan={false}
        scrollZoom={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <span
              className="h-4 w-4 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: markerColor(vehicle) }}
            />
            <span
              className="mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-[0.04em] text-white shadow-sm"
              style={{ backgroundColor: monument.ink }}
            >
              {cab}
            </span>
          </div>
        </Marker>
      </Map>
      {positionLabel && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 px-3 py-2 text-center"
          style={{ backgroundColor: 'rgba(250,250,248,0.92)' }}
        >
          <p className={monumentType.revealHint} style={{ color: monument.inkMuted }}>{positionLabel}</p>
        </div>
      )}
    </div>
  );
}
