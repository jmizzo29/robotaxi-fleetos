import { readJsonResponse } from './apiClient';

const OPERATING_BASE = {
  label: 'RoboAgent Central Florida Base',
  latitude: 28.084192,
  longitude: -81.725751,
};

export function hasCoordinates(vehicle) {
  return Number.isFinite(Number(vehicle?.latitude)) && Number.isFinite(Number(vehicle?.longitude));
}

export function distanceMiles(a, b) {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const earthRadiusMiles = 3958.8;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceFromOperatingBase(vehicle) {
  const miles = distanceMiles(OPERATING_BASE, vehicle);
  return {
    base: OPERATING_BASE,
    miles,
  };
}

export async function reverseGeocodeLocation(vehicle) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!token || !hasCoordinates(vehicle)) {
    return null;
  }

  const longitude = Number(vehicle.longitude).toFixed(6);
  const latitude = Number(vehicle.latitude).toFixed(6);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address,poi,place,locality,neighborhood&limit=3&access_token=${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Reverse geocode failed with ${response.status}`);
  }

  const data = await readJsonResponse(response, { features: [] });
  const feature = data.features?.[0];

  if (!feature) return null;

  return {
    label: feature.place_name,
    shortLabel: feature.text,
    type: feature.place_type?.[0] || 'place',
    coordinates: feature.center,
  };
}

export function buildGoogleStreetViewUrl(vehicle) {
  if (!hasCoordinates(vehicle)) return null;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${vehicle.latitude},${vehicle.longitude}`;
}

export function buildMapillaryUrl(vehicle) {
  if (!hasCoordinates(vehicle)) return null;
  return `https://www.mapillary.com/app/?lat=${vehicle.latitude}&lng=${vehicle.longitude}&z=17`;
}

export function buildGoogleStreetViewPreviewUrl(vehicle) {
  const key = import.meta.env.VITE_GOOGLE_STREET_VIEW_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || !hasCoordinates(vehicle)) return null;

  const heading = Number.isFinite(Number(vehicle.heading)) ? Math.round(Number(vehicle.heading)) : 0;
  return `https://maps.googleapis.com/maps/api/streetview?size=720x420&location=${vehicle.latitude},${vehicle.longitude}&heading=${heading}&pitch=0&fov=80&key=${key}`;
}
