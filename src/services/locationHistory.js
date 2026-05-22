const MAX_RECORDS_PER_VEHICLE = 80;
let locationHistoryCache = {};

function readAllHistory() {
  return locationHistoryCache;
}

function writeAllHistory(history) {
  locationHistoryCache = history;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fleetos-location-history-updated'));
  }
}

export function vehicleHistoryKey(vehicle) {
  return vehicle?.vin || vehicle?.id || vehicle?.display_name || vehicle?.name || 'unknown';
}

export function appendLocationSnapshot(vehicle, syncedAt = new Date().toISOString()) {
  const latitude = Number(vehicle?.latitude);
  const longitude = Number(vehicle?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const key = vehicleHistoryKey(vehicle);
  const history = readAllHistory();
  const previousRecords = Array.isArray(history[key]) ? history[key] : [];
  const previous = previousRecords[0];
  const movedFeet = previous
    ? Math.round(distanceMiles(previous, { latitude, longitude }) * 5280)
    : 0;

  const record = {
    id: `${key}-${Date.now()}`,
    vehicleKey: key,
    name: vehicle?.display_name || vehicle?.name || vehicle?.id || 'Tesla',
    vin: vehicle?.vin,
    latitude,
    longitude,
    heading: vehicle?.heading ?? null,
    speed: vehicle?.speed ?? 0,
    battery: vehicle?.battery ?? null,
    chargingState: vehicle?.chargingState || null,
    status: vehicle?.status || vehicle?.state || null,
    odometer: vehicle?.odometer ?? null,
    movedFeet,
    timestamp: syncedAt,
  };

  history[key] = [record, ...previousRecords]
    .filter((item, index, all) => index === 0 || item.latitude !== all[0].latitude || item.longitude !== all[0].longitude || item.timestamp !== all[0].timestamp)
    .slice(0, MAX_RECORDS_PER_VEHICLE);

  writeAllHistory(history);
  return record;
}

export function getLocationHistory(vehicle) {
  const key = vehicleHistoryKey(vehicle);
  return readAllHistory()[key] || [];
}

export function distanceMiles(a, b) {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return 0;

  const earthRadiusMiles = 3958.8;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const originLat = toRad(lat1);
  const destinationLat = toRad(lat2);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(originLat) * Math.cos(destinationLat) * sinLon * sinLon;

  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function summarizeLocationHistory(records = []) {
  const latest = records[0] || null;
  const previous = records[1] || null;
  const totalMiles = records.slice(1).reduce((sum, record, index) => {
    const prior = records[index];
    return sum + distanceMiles(record, prior);
  }, 0);
  const lastMoved = records.find((record) => Number(record.movedFeet) > 100);

  return {
    latest,
    previous,
    totalMiles,
    lastMoved,
    snapshotCount: records.length,
  };
}
