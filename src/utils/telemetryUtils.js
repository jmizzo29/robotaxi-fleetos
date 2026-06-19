import { lastSyncedLabel, vehicleBatteryPercent, vehicleStateLabel, getCommandOperationalSource } from './vehicleDisplayUtils';
import { findVehicleByCab, getTopEarner } from './monumentUtils';

function cabLabel(vehicle, index) {
  if (vehicle?.isReal) {
    const name = vehicle.display_name || vehicle.name;
    if (name) return name;
  }
  const id = String(vehicle?.id || vehicle?.name || '');
  const carMatch = id.match(/CAR-(\d+)/i);
  if (carMatch) return `CAB-${carMatch[1].padStart(2, '0')}`;
  const match = id.match(/\d+/);
  if (match) return `CAB-${String(match[0]).padStart(2, '0')}`;
  return `CAB-${String(index + 1).padStart(2, '0')}`;
}

/** Normalize Tesla fields from live API, cached raw, or merged fleet objects. */
export function extractVehicleTelemetry(vehicle = {}) {
  const chargeState = vehicle.charge_state || {};
  const driveState = vehicle.drive_state || {};
  const vehicleState = vehicle.vehicle_state || {};
  const locationData = vehicle.location_data || {};

  const battery = vehicle.battery ?? chargeState.battery_level ?? vehicle.battery_level;
  const chargingState = vehicle.chargingState ?? chargeState.charging_state;
  const odometer = vehicle.odometer ?? vehicleState.odometer ?? vehicle.odometerMiles;
  const software = vehicle.softwareVersion ?? vehicle.software ?? vehicleState.car_version;
  const latitude = vehicle.latitude ?? driveState.latitude ?? locationData.latitude;
  const longitude = vehicle.longitude ?? driveState.longitude ?? locationData.longitude;
  const speed = vehicle.speed ?? driveState.speed;

  return {
    battery: Number.isFinite(Number(battery)) ? Math.round(Number(battery)) : null,
    chargingState: chargingState || null,
    odometer: Number.isFinite(Number(odometer)) ? Number(odometer) : null,
    software: software || null,
    latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
    longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
    speed: Number.isFinite(Number(speed)) ? Number(speed) : null,
    state: vehicleStateLabel(vehicle),
    syncedAt: vehicle.syncedAt || vehicle.lastSyncedAt || null,
  };
}

function formatOdometer(miles) {
  if (!Number.isFinite(miles)) return '—';
  return `${Math.round(miles).toLocaleString()} mi`;
}

function formatPosition(vehicle, telemetry) {
  if (Number.isFinite(telemetry.latitude) && Number.isFinite(telemetry.longitude)) {
    return `${telemetry.latitude.toFixed(4)}, ${telemetry.longitude.toFixed(4)}`;
  }

  const city = vehicle?.city ? String(vehicle.city).split(',')[0].trim() : null;
  const status = String(vehicle?.status || '').toUpperCase();
  if (status.includes('MCO') || status.includes('AIRPORT')) return `${city || 'Orlando'} · MCO`;
  if (city) return `${city} · last known`;
  return '—';
}

function syncLabel(realSyncStatus, vehicle) {
  const synced = lastSyncedLabel(
    vehicle?.syncedAt || vehicle?.lastSyncedAt || realSyncStatus?.lastSyncedAt,
    '',
  );
  if (synced) return synced.replace(/^Last synced\s*/i, '');
  if (realSyncStatus?.state === 'loading') return 'syncing…';
  if (realSyncStatus?.state === 'success') return 'just now';
  return '—';
}

function formatCharging(chargingState, offline) {
  if (chargingState) return String(chargingState);
  return offline ? '—' : 'Idle';
}

/** Sheet T — five fleet OS signals + sync metadata (not vehicle controls). */
export function getTelemetrySheetPayload(vehicle, cab, realSyncStatus = null) {
  if (!vehicle) return null;

  const telemetry = extractVehicleTelemetry(vehicle);
  const offline = telemetry.state === 'Offline' || telemetry.state === 'Asleep';

  const rows = [
    {
      label: 'state',
      value: telemetry.state,
      tone: offline ? 'alert' : 'positive',
    },
    {
      label: 'battery',
      value: telemetry.battery !== null ? `${telemetry.battery}%` : '—',
      tone: telemetry.battery !== null && telemetry.battery < 40 ? 'alert' : 'neutral',
    },
    {
      label: 'odometer',
      value: formatOdometer(telemetry.odometer),
      tone: 'neutral',
    },
    {
      label: 'charging',
      value: formatCharging(telemetry.chargingState, offline),
      tone: 'neutral',
    },
    {
      label: 'position',
      value: formatPosition(vehicle, telemetry),
      tone: telemetry.latitude !== null ? 'positive' : 'neutral',
    },
    {
      label: 'last sync',
      value: syncLabel(realSyncStatus, vehicle),
      tone: 'positive',
    },
    {
      label: 'software',
      value: telemetry.software || '—',
      tone: 'neutral',
    },
  ];

  if (telemetry.speed !== null && telemetry.speed > 0) {
    rows.splice(5, 0, {
      label: 'speed',
      value: `${Math.round(telemetry.speed)} mph`,
      tone: 'positive',
    });
  }

  return {
    cab,
    statusLine: offline ? 'Asleep · wake & sync for live telemetry' : `${telemetry.state} · telemetry live`,
    offline,
    rows,
    filledCount: rows.filter((row) => row.value && row.value !== '—').length,
    totalCount: rows.length,
  };
}

/** Focus CAB for telemetry sheet — offline first, then preferred, then top earner. */
export function getTelemetryFocusTarget(
  fleet,
  realFleet,
  totalEarnings,
  syncState,
  preferredCab = null,
) {
  if (preferredCab) {
    const preferred = findVehicleByCab(preferredCab, fleet, realFleet, totalEarnings, syncState);
    if (preferred) return preferred;
  }

  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const offlineVehicle = source.find((vehicle) => {
    const state = vehicleStateLabel(vehicle);
    return state === 'Offline' || state === 'Asleep';
  });

  if (offlineVehicle) {
    const index = source.indexOf(offlineVehicle);
    return { vehicle: offlineVehicle, index, cab: cabLabel(offlineVehicle, index) };
  }

  return getTopEarner(fleet, realFleet, totalEarnings, syncState);
}
