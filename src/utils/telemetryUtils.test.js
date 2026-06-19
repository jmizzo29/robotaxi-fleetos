import { describe, expect, it } from 'vitest';
import {
  extractVehicleTelemetry,
  getTelemetryFocusTarget,
  getTelemetrySheetPayload,
} from './telemetryUtils';

const fleet = [
  { id: 'CAR-001', battery: 82, revenue: 420, status: 'ONLINE', city: 'Orlando, FL' },
  { id: 'CAR-002', battery: 18, revenue: 120, status: 'OFFLINE', city: 'Tampa, FL' },
];

describe('telemetryUtils', () => {
  it('builds all telemetry sheet rows for a vehicle', () => {
    const payload = getTelemetrySheetPayload(fleet[0], 'CAB-01', { state: 'success' });
    expect(payload.cab).toBe('CAB-01');
    expect(payload.rows.map((row) => row.label)).toEqual([
      'state',
      'battery',
      'odometer',
      'charging',
      'position',
      'last sync',
      'software',
    ]);
    expect(payload.rows.find((row) => row.label === 'battery')?.value).toBe('82%');
    expect(payload.totalCount).toBe(7);
  });

  it('reads nested Tesla telemetry fields when top-level values are missing', () => {
    const telemetry = extractVehicleTelemetry({
      state: 'online',
      charge_state: { battery_level: 71, charging_state: 'Complete' },
      vehicle_state: { odometer: 12050, car_version: '2025.14.3' },
      drive_state: { latitude: 28.54, longitude: -81.38 },
    });

    expect(telemetry.battery).toBe(71);
    expect(telemetry.chargingState).toBe('Complete');
    expect(telemetry.odometer).toBe(12050);
    expect(telemetry.software).toBe('2025.14.3');
    expect(telemetry.latitude).toBe(28.54);
  });

  it('prefers offline CAB for telemetry focus', () => {
    const target = getTelemetryFocusTarget(fleet, [], 0, 'idle');
    expect(target?.cab).toBe('CAB-002');
    expect(target?.vehicle?.status).toBe('OFFLINE');
  });

  it('uses preferred CAB when provided', () => {
    const target = getTelemetryFocusTarget(fleet, [], 0, 'idle', 'CAB-001');
    expect(target?.cab).toBe('CAB-001');
  });
});
