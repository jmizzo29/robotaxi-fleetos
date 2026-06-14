import { describe, expect, it } from 'vitest';
import { getTelemetryFocusTarget, getTelemetrySheetPayload } from './telemetryUtils';

const fleet = [
  { id: 'CAR-001', battery: 82, revenue: 420, status: 'ONLINE', city: 'Orlando, FL' },
  { id: 'CAR-002', battery: 18, revenue: 120, status: 'OFFLINE', city: 'Tampa, FL' },
];

describe('telemetryUtils', () => {
  it('builds telemetry sheet rows for a vehicle', () => {
    const payload = getTelemetrySheetPayload(fleet[0], 'CAB-01', { state: 'success' });
    expect(payload.cab).toBe('CAB-01');
    expect(payload.rows.some((row) => row.label === 'battery')).toBe(true);
    expect(payload.rows.find((row) => row.label === 'battery')?.value).toBe('82%');
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
