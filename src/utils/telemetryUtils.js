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

function formatOdometer(vehicle) {
  const miles = Number(vehicle?.odometer ?? vehicle?.odometerMiles);
  if (!Number.isFinite(miles)) return '—';
  return `${Math.round(miles).toLocaleString()} mi`;
}

function formatPosition(vehicle) {
  const city = vehicle?.city ? String(vehicle.city).split(',')[0].trim() : null;
  const status = String(vehicle?.status || '').toUpperCase();
  if (status.includes('MCO') || status.includes('AIRPORT')) return `${city || 'Orlando'} · MCO`;
  return city || 'Orlando';
}

function syncLabel(realSyncStatus, vehicle) {
  const synced = lastSyncedLabel(vehicle?.lastSyncedAt || realSyncStatus?.syncedAt, '');
  if (synced) return synced.replace(/^Last synced\s*/i, '');
  if (realSyncStatus?.state === 'loading') return 'syncing…';
  if (realSyncStatus?.state === 'success') return 'just now';
  return '—';
}

/** Sheet T — per-CAB telemetry ledger (fleet OS signals, not vehicle controls). */
export function getTelemetrySheetPayload(vehicle, cab, realSyncStatus = null) {
  if (!vehicle) return null;

  const battery = vehicleBatteryPercent(vehicle);
  const state = vehicleStateLabel(vehicle);
  const charging = String(vehicle?.chargingState || 'Idle');
  const offline = state === 'Offline' || state === 'Asleep';

  const rows = [
    {
      label: 'battery',
      value: battery !== null ? `${battery}%` : '—',
      tone: battery !== null && battery < 40 ? 'alert' : 'neutral',
    },
    { label: 'odometer', value: formatOdometer(vehicle), tone: 'neutral' },
    { label: 'charging', value: charging, tone: 'neutral' },
    { label: 'last sync', value: syncLabel(realSyncStatus, vehicle), tone: 'positive' },
    { label: 'position', value: formatPosition(vehicle), tone: 'neutral' },
    {
      label: 'software',
      value: vehicle?.softwareVersion || vehicle?.software || '—',
      tone: 'neutral',
    },
  ];

  if (Number.isFinite(Number(vehicle?.speed)) && Number(vehicle.speed) > 0) {
    rows.splice(4, 0, {
      label: 'speed',
      value: `${Math.round(Number(vehicle.speed))} mph`,
      tone: 'positive',
    });
  }

  return {
    cab,
    statusLine: offline ? `Offline · last seen recently` : `${state} · telemetry live`,
    offline,
    rows,
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
