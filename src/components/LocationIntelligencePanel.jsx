import { useEffect, useState } from 'react';
import {
  buildGoogleStreetViewPreviewUrl,
  buildGoogleStreetViewUrl,
  buildMapillaryUrl,
  distanceFromOperatingBase,
  hasCoordinates,
  reverseGeocodeLocation,
} from '../services/locationIntelligence';

function formatCoordinate(value) {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  return Number(value).toFixed(6);
}

function formatHeading(value) {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  return `${Math.round(Number(value))} deg`;
}

function formatGpsTimestamp(value) {
  if (!value) return 'Unavailable';
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 1000000000000 ? numeric : numeric * 1000)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString();
}

function buildMapboxPreviewUrl({ latitude, longitude, heading, token }) {
  if (!token || !hasCoordinates({ latitude, longitude })) return null;

  const lon = Number(longitude).toFixed(6);
  const lat = Number(latitude).toFixed(6);
  const bearing = Number.isFinite(Number(heading)) ? Math.round(Number(heading)) : 0;
  const pin = `pin-s+10b981(${lon},${lat})`;

  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${pin}/${lon},${lat},17,${bearing},58/720x420@2x?access_token=${token}`;
}

function Detail({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

export default function LocationIntelligencePanel({ vehicle, onShowMap }) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [place, setPlace] = useState(null);
  const [placeError, setPlaceError] = useState(null);
  const hasLocation = hasCoordinates(vehicle);
  const latitude = vehicle?.latitude;
  const longitude = vehicle?.longitude;
  const baseDistance = hasLocation ? distanceFromOperatingBase(vehicle) : null;
  const streetViewPreviewUrl = hasLocation ? buildGoogleStreetViewPreviewUrl(vehicle) : null;
  const streetViewUrl = hasLocation ? buildGoogleStreetViewUrl(vehicle) : null;
  const mapillaryUrl = hasLocation ? buildMapillaryUrl(vehicle) : null;
  const previewUrl = hasLocation
    ? buildMapboxPreviewUrl({
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      heading: vehicle.heading,
      token: mapboxToken,
    })
    : null;

  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${vehicle.latitude},${vehicle.longitude}`
    : null;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!hasLocation) {
        if (!cancelled) {
          setPlace(null);
          setPlaceError(null);
        }
        return;
      }

      try {
        const nextPlace = await reverseGeocodeLocation({ latitude, longitude });
        if (!cancelled) {
          setPlace(nextPlace);
          setPlaceError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPlace(null);
          setPlaceError(error.message);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasLocation, latitude, longitude]);

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Location Intelligence
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Precise Position
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Uses Tesla vehicle location scope when available, with satellite context for a street-adjacent operating view.
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase ${
          hasLocation
            ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200'
            : 'border-amber-300/25 bg-amber-400/10 text-amber-200'
        }`}
        >
          {hasLocation ? 'GPS Ready' : 'No GPS'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[260px] overflow-hidden rounded-lg border border-white/10 bg-slate-950">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Satellite preview near vehicle location"
              className="h-full min-h-[260px] w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Sync Tesla telemetry with Vehicle Location scope to show a satellite preview.
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-full border border-black/20 bg-slate-950/85 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-100 backdrop-blur">
            Satellite Streets
          </div>
          {hasLocation && Number.isFinite(Number(vehicle.heading)) && (
            <div className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/85 text-sky-200 shadow-xl backdrop-blur">
              <span
                className="block text-xl"
                style={{ transform: `rotate(${Number(vehicle.heading)}deg)` }}
                aria-hidden="true"
              >
                ^
              </span>
              <span className="sr-only">Vehicle heading {formatHeading(vehicle.heading)}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Nearest Place" value={place?.shortLabel || (placeError ? 'Lookup unavailable' : 'Resolving...')} />
            <Detail
              label="From Base"
              value={Number.isFinite(baseDistance?.miles) ? `${baseDistance.miles.toFixed(2)} mi` : 'Unavailable'}
            />
            <Detail label="Latitude" value={formatCoordinate(vehicle?.latitude)} />
            <Detail label="Longitude" value={formatCoordinate(vehicle?.longitude)} />
            <Detail label="Heading" value={formatHeading(vehicle?.heading)} />
            <Detail label="Speed" value={`${Math.round(Number(vehicle?.speed || 0))} mph`} />
            <Detail label="GPS Timestamp" value={formatGpsTimestamp(vehicle?.gpsAsOf)} />
            <Detail label="State" value={vehicle?.status || vehicle?.state || 'Unavailable'} />
          </div>

          <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
            {hasLocation
              ? place?.label || 'This position is coming from Tesla telemetry. If the car is parked, RoboAgent should anchor it here instead of moving it through simulation.'
              : 'RoboAgent does not have a real Tesla GPS fix yet. Re-sync after confirming Vehicle Location scope and in-car data sharing.'}
          </div>

          {streetViewPreviewUrl && (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950">
              <img
                src={streetViewPreviewUrl}
                alt="Street-level preview near vehicle location"
                className="h-40 w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onShowMap}
              className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
            >
              Center Map
            </button>
            <a
              href={mapsUrl || undefined}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md border px-4 py-3 text-center text-sm font-bold transition ${
                mapsUrl
                  ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                  : 'pointer-events-none border-white/5 bg-white/[0.02] text-slate-600'
              }`}
            >
              Open Maps
            </a>
            <a
              href={streetViewUrl || undefined}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md border px-4 py-3 text-center text-sm font-bold transition ${
                streetViewUrl
                  ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                  : 'pointer-events-none border-white/5 bg-white/[0.02] text-slate-600'
              }`}
            >
              Street View
            </a>
            <a
              href={mapillaryUrl || undefined}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md border px-4 py-3 text-center text-sm font-bold transition ${
                mapillaryUrl
                  ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                  : 'pointer-events-none border-white/5 bg-white/[0.02] text-slate-600'
              }`}
            >
              Mapillary
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
