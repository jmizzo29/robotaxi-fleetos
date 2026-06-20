import { describe, expect, it } from 'vitest';
import {
  getFleetTelemetryIntelligence,
  getVehicleActivityEvents,
  getVehicleTelemetryIntelligence,
} from './telemetryIntelligence';

const NOW = '2026-06-20T15:00:00.000Z';
const FRESH_SYNC = '2026-06-20T14:56:00.000Z';

const readyVehicle = {
  id: 'tesla-1',
  vin: '5YJREADY',
  display_name: 'Model Y',
  state: 'online',
  status: 'PARKED',
  battery: 86,
  chargingState: 'Disconnected',
  locked: true,
  serviceMode: false,
  latitude: 28.54,
  longitude: -81.38,
  syncedAt: FRESH_SYNC,
};

describe('getVehicleTelemetryIntelligence', () => {
  it('turns healthy telemetry into a revenue-ready owner answer', () => {
    const intelligence = getVehicleTelemetryIntelligence(readyVehicle, { now: NOW });

    expect(intelligence.revenueReadiness.label).toBe('Ready For Revenue');
    expect(intelligence.revenueReadiness.score).toBeGreaterThanOrEqual(90);
    expect(intelligence.assetHealth.label).toBe('Excellent');
    expect(intelligence.availability.available).toBe(true);
    expect(intelligence.attention.needsAttention).toBe(false);
    expect(intelligence.attention.recommendedAction).toBe('Keep this vehicle in the earning pool.');
  });

  it('holds back critically low battery vehicles', () => {
    const intelligence = getVehicleTelemetryIntelligence({
      ...readyVehicle,
      battery: 14,
    }, { now: NOW });

    expect(intelligence.revenueReadiness.label).toBe('Hold Back');
    expect(intelligence.availability.available).toBe(false);
    expect(intelligence.availability.state).toBe('low_battery');
    expect(intelligence.attention.primaryReason).toBe('Battery is below the revenue floor.');
    expect(intelligence.attention.recommendedAction).toBe('Route to charging before accepting work.');
  });

  it('prioritizes service mode over ordinary availability', () => {
    const intelligence = getVehicleTelemetryIntelligence({
      ...readyVehicle,
      serviceMode: true,
    }, { now: NOW });

    expect(intelligence.assetHealth.label).toBe('Needs Attention');
    expect(intelligence.availability.state).toBe('service');
    expect(intelligence.attention.recommendedAction).toBe('Service mode active');
  });

  it('reduces confidence and readiness when telemetry is stale', () => {
    const intelligence = getVehicleTelemetryIntelligence({
      ...readyVehicle,
      syncedAt: '2026-06-20T12:00:00.000Z',
    }, { now: NOW });

    expect(intelligence.confidence.stale).toBe(true);
    expect(intelligence.confidence.label).not.toBe('High');
    expect(intelligence.revenueReadiness.blockers).toContain('Telemetry is stale.');
  });
});

describe('getFleetTelemetryIntelligence', () => {
  it('rolls vehicle intelligence into fleet availability and status', () => {
    const fleet = [
      readyVehicle,
      { ...readyVehicle, id: 'tesla-2', display_name: 'Model 3', battery: 18 },
      { ...readyVehicle, id: 'tesla-3', display_name: 'Model X', state: 'asleep', status: 'ASLEEP' },
    ];

    const intelligence = getFleetTelemetryIntelligence([], fleet, { state: 'success' }, { now: NOW });

    expect(intelligence.source).toBe('real');
    expect(intelligence.totals.total).toBe(3);
    expect(intelligence.totals.available).toBe(1);
    expect(intelligence.totals.needsAttention).toBe(2);
    expect(intelligence.status.headline).toBe('Fleet Needs Attention');
    expect(intelligence.topAction.priority).toBe('high');
  });

  it('returns a connect-oriented status for an empty fleet', () => {
    const intelligence = getFleetTelemetryIntelligence([], [], { state: 'idle' }, { now: NOW });

    expect(intelligence.totals.total).toBe(0);
    expect(intelligence.status.headline).toBe('Action Recommended');
    expect(intelligence.status.detail).toContain('Connect Tesla');
  });

  it('turns sync errors into the fleet top action', () => {
    const intelligence = getFleetTelemetryIntelligence([], [readyVehicle], {
      state: 'error',
      message: 'Tesla API unavailable.',
    }, { now: NOW });

    expect(intelligence.status.headline).toBe('Fleet Needs Attention');
    expect(intelligence.topAction.label).toBe('Retry Tesla sync');
    expect(intelligence.topAction.reason).toBe('Tesla API unavailable.');
  });
});

describe('getVehicleActivityEvents', () => {
  it('creates owner-friendly trip and charging transition events', () => {
    const previous = {
      ...readyVehicle,
      speed: 0,
      chargingState: 'Charging',
      battery: 90,
    };
    const current = {
      ...readyVehicle,
      speed: 34,
      chargingState: 'Disconnected',
      battery: 72,
      syncedAt: NOW,
    };

    const events = getVehicleActivityEvents(current, previous);

    expect(events.map((event) => event.title)).toEqual([
      'Trip Started',
      'Charging Completed',
      'Battery Used',
    ]);
  });

  it('creates availability events when a vehicle returns online', () => {
    const previous = { ...readyVehicle, state: 'asleep', status: 'ASLEEP' };
    const current = { ...readyVehicle, state: 'online', status: 'PARKED', syncedAt: NOW };

    const events = getVehicleActivityEvents(current, previous);

    expect(events[0].title).toBe('Vehicle Available');
  });
});
