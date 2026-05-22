import { getDefaultFleetForSession, teslaRequestForSession } from './_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const TESLA_REDIRECT_URI = process.env.TESLA_REDIRECT_URI || 'http://localhost:3001/callback';

function normalizeVehicle(vehicle, telemetry = {}) {
  const chargeState = telemetry.charge_state || vehicle.charge_state || {};
  const driveState = telemetry.drive_state || vehicle.drive_state || {};
  const vehicleState = telemetry.vehicle_state || vehicle.vehicle_state || {};
  const locationData = telemetry.location_data || vehicle.location_data || {};

  return {
    ...vehicle,
    ...telemetry,
    id: vehicle.id_s || vehicle.id,
    vin: vehicle.vin,
    display_name: vehicle.display_name || vehicleState.vehicle_name || 'My Tesla',
    state: vehicle.state,
    status: driveState.shift_state ? 'DRIVING' : vehicle.state === 'online' ? 'PARKED' : vehicle.state?.toUpperCase(),
    battery: chargeState.battery_level,
    latitude: driveState.latitude ?? locationData.latitude,
    longitude: driveState.longitude ?? locationData.longitude,
    chargingState: chargeState.charging_state,
    softwareVersion: vehicleState.car_version,
    locked: vehicleState.locked,
    serviceMode: vehicleState.service_mode,
    odometer: vehicleState.odometer,
    speed: driveState.speed,
    heading: driveState.heading ?? locationData.heading,
    gpsAsOf: driveState.gps_as_of ?? locationData.gps_as_of,
    syncedAt: new Date().toISOString(),
  };
}

async function saveVehicleTelemetry(fleetId, vehicles) {
  if (!hasPostgres()) return;
  await ensureFleetSchema();

  await Promise.all(vehicles.map(async (vehicle) => {
    const vehicleId = String(vehicle.id || vehicle.vin || `vehicle-${Date.now()}`);
    await query(
      `insert into fleetos_vehicles (
        id, vin, tesla_vehicle_id, display_name, state, status, battery_level,
        fleet_id,
        latitude, longitude, heading, speed, odometer, charging_state,
        software_version, locked, service_mode, raw, last_synced_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, now())
      on conflict (id) do update set
        vin = excluded.vin,
        tesla_vehicle_id = excluded.tesla_vehicle_id,
        display_name = excluded.display_name,
        fleet_id = excluded.fleet_id,
        state = excluded.state,
        status = excluded.status,
        battery_level = excluded.battery_level,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        heading = excluded.heading,
        speed = excluded.speed,
        odometer = excluded.odometer,
        charging_state = excluded.charging_state,
        software_version = excluded.software_version,
        locked = excluded.locked,
        service_mode = excluded.service_mode,
        raw = excluded.raw,
        last_synced_at = excluded.last_synced_at,
        updated_at = now()`,
      [
        vehicleId,
        vehicle.vin || null,
        String(vehicle.id || '') || null,
        vehicle.display_name || null,
        vehicle.state || null,
        vehicle.status || null,
        vehicle.battery ?? null,
        fleetId,
        vehicle.latitude ?? null,
        vehicle.longitude ?? null,
        vehicle.heading ?? null,
        vehicle.speed ?? null,
        vehicle.odometer ?? null,
        vehicle.chargingState || null,
        vehicle.softwareVersion || null,
        vehicle.locked ?? null,
        vehicle.serviceMode ?? null,
        JSON.stringify(vehicle),
        vehicle.syncedAt || new Date().toISOString(),
      ],
    );

    await query(
      `insert into fleetos_telemetry_snapshots (
        vehicle_id, vin, captured_at, state, status, battery_level, latitude, longitude,
        heading, speed, odometer, charging_state, software_version, locked, service_mode, raw
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        vehicleId,
        vehicle.vin || null,
        vehicle.syncedAt || new Date().toISOString(),
        vehicle.state || null,
        vehicle.status || null,
        vehicle.battery ?? null,
        vehicle.latitude ?? null,
        vehicle.longitude ?? null,
        vehicle.heading ?? null,
        vehicle.speed ?? null,
        vehicle.odometer ?? null,
        vehicle.chargingState || null,
        vehicle.softwareVersion || null,
        vehicle.locked ?? null,
        vehicle.serviceMode ?? null,
        JSON.stringify(vehicle),
      ],
    );
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (req.query?.debug === '1') {
    res.status(200).json({
      ok: true,
      refreshFormKeys: [
        'grant_type',
        'client_id',
        'refresh_token',
        'redirect_uri',
      ],
      redirectUri: TESLA_REDIRECT_URI,
      teslaConfigured: Boolean(process.env.TESLA_CLIENT_ID),
    });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres DATABASE_URL is required before syncing Tesla telemetry.',
    });
    return;
  }

  if (!process.env.TESLA_CLIENT_ID) {
    res.status(503).json({
      error: 'TESLA_CONFIG_MISSING',
      message: 'TESLA_CLIENT_ID is not configured in Vercel.',
    });
    return;
  }

  try {
    const vehiclesPayload = await teslaRequestForSession(req, res, '/api/1/vehicles', {
      baseURL: DEFAULT_FLEET_API_BASE,
    });
    const vehicles = vehiclesPayload.response || [];

    const response = await Promise.all(
      vehicles.map(async (vehicle) => {
        if (vehicle.state !== 'online') {
          return normalizeVehicle(vehicle);
        }

        try {
          const telemetryPayload = await teslaRequestForSession(req, res, `/api/1/vehicles/${vehicle.id_s || vehicle.id}/vehicle_data`, {
            baseURL: DEFAULT_FLEET_API_BASE,
            params: {
              endpoints: 'charge_state;drive_state;location_data;vehicle_state',
            },
          });

          return normalizeVehicle(vehicle, telemetryPayload.response || {});
        } catch {
          return normalizeVehicle(vehicle);
        }
      }),
    );

    const context = await getDefaultFleetForSession(req, res);
    await saveVehicleTelemetry(context.fleet.id, response);
    res.status(200).json({ response, postgres: hasPostgres() });
  } catch (error) {
    res.status(502).json({
      error: 'TESLA_API_UNAVAILABLE',
      message: error.message,
    });
  }
}
