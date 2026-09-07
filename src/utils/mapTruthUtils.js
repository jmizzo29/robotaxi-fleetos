import { vehicleDisplayName, vehicleStateLabel } from './vehicleDisplayUtils';

const DEMO_ID = /^CAR-\d+/i;
const US_FALLBACK_VIEW = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.4,
};

export function hasGpsFix(vehicle) {
  const lat = Number(vehicle?.latitude);
  const lng = Number(vehicle?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function isDemoMapVehicle(vehicle) {
  if (!vehicle) return true;
  if (vehicle.isReal) return false;
  return DEMO_ID.test(String(vehicle.id || vehicle.name || ''));
}

/**
 * Map pins and counts — real Tesla telemetry only unless `?mock`.
 * Connected/authed sessions never receive CAR-001 / cybercab demo pins.
 */
export function getMapTruthSource(fleet = [], realFleet = [], { mock = false } = {}) {
  if (mock) {
    const demo = (Array.isArray(fleet) ? fleet : []).filter((vehicle) => !vehicle.isReal);
    return demo.length ? demo : (Array.isArray(fleet) ? fleet : []);
  }
  if (Array.isArray(realFleet) && realFleet.length) {
    return realFleet.filter((vehicle) => vehicle?.isReal !== false);
  }
  return (Array.isArray(fleet) ? fleet : []).filter((vehicle) => vehicle?.isReal);
}

export function getMapLocatedVehicles(source = []) {
  return source.filter(hasGpsFix);
}

export function shouldShowMapDemoOverlays(mock = false) {
  return Boolean(mock);
}

export function getMapVehicleLabel(vehicle, index = 0, { mock = false } = {}) {
  if (vehicle?.isReal) {
    return vehicleDisplayName(vehicle);
  }
  if (mock) {
    const id = String(vehicle?.id || vehicle?.name || '');
    const carMatch = id.match(/CAR-(\d+)/i);
    if (carMatch) return `CAB-${carMatch[1].padStart(2, '0')}`;
    return vehicle?.name || vehicle?.ownership?.tag || `CAB-${String(index + 1).padStart(2, '0')}`;
  }
  return vehicleDisplayName(vehicle);
}

export function getMapViewState(located = [], { mock = false } = {}) {
  if (located.length === 1) {
    return {
      longitude: Number(located[0].longitude),
      latitude: Number(located[0].latitude),
      zoom: 12,
    };
  }
  if (located.length > 1) {
    const lats = located.map((vehicle) => Number(vehicle.latitude));
    const lngs = located.map((vehicle) => Number(vehicle.longitude));
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 9,
    };
  }
  if (mock) {
    return { longitude: -81.3792, latitude: 28.5383, zoom: 10 };
  }
  return { ...US_FALLBACK_VIEW };
}

export function getMapEmptyCopy({
  mock = false,
  loading = false,
  teslaConnected = false,
  sourceCount = 0,
  locatedCount = 0,
} = {}) {
  if (mock) {
    return {
      title: 'Demo preview',
      body: 'Illustrative fleet and demand overlays. Not live Tesla telemetry.',
    };
  }
  if (loading) {
    return {
      title: 'Syncing Tesla',
      body: 'Waiting for vehicle location from Tesla.',
    };
  }
  if (!teslaConnected && sourceCount === 0) {
    return {
      title: 'No vehicles on the map',
      body: 'Connect Tesla to show live GPS. This tab does not invent a demo fleet.',
    };
  }
  if (sourceCount > 0 && locatedCount === 0) {
    return {
      title: 'No GPS yet',
      body: 'Tesla is linked, but no vehicle has reported a usable location.',
    };
  }
  return null;
}

export function isVehicleMoving(vehicle) {
  const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  return status.includes('EN ROUTE')
    || status.includes('REPOSITION')
    || status.includes('PICKUP')
    || status.includes('IN SERVICE');
}

export function getMapMarkerTone(vehicle) {
  const status = String(vehicle?.status || vehicle?.state || '').toUpperCase();
  if (status.includes('OFFLINE') || status.includes('ASLEEP')) return 'off';
  if (status.includes('CHARG') || vehicleStateLabel(vehicle) === 'Charging') return 'charge';
  return 'active';
}
