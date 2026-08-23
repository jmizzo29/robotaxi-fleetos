import { describe, expect, it } from 'vitest';
import {
  OWNER_ALERT_TRIGGERS,
  evaluateOwnerAlert,
  isOwnerAlertCooldownActive,
  pickPrimaryOwnerAlert,
} from './evaluateOwnerAlert';

const now = new Date('2026-08-23T16:00:00.000Z');

function car(overrides = {}) {
  return {
    vin: '5YJ3E1EA7NF000001',
    display_name: 'Model Y',
    battery: 40,
    chargingState: 'Disconnected',
    state: 'online',
    syncedAt: now.toISOString(),
    ...overrides,
  };
}

describe('evaluateOwnerAlert', () => {
  it('fires battery_low at or below 15% when not charging', () => {
    const alert = evaluateOwnerAlert(car({ battery: 15, chargingState: 'Stopped' }), now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.BATTERY_LOW);
    expect(alert.action).toBe('charge');
    expect(alert.body).toContain('15%');
  });

  it('does not fire battery_low while already charging', () => {
    expect(evaluateOwnerAlert(car({ battery: 12, chargingState: 'Charging' }), now)).toBeNull();
  });

  it('fires charge_failed on Tesla error state', () => {
    const alert = evaluateOwnerAlert(car({ battery: 44, chargingState: 'Error' }), now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.CHARGE_FAILED);
    expect(alert.title).toBe('Charge failed');
  });

  it('treats Stopped below the charge limit as an unexpected stop', () => {
    const alert = evaluateOwnerAlert(car({
      battery: 41,
      chargingState: 'Stopped',
      chargeLimit: 80,
    }), now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.CHARGE_FAILED);
  });

  it('uses charge history failure when live state is quiet', () => {
    const alert = evaluateOwnerAlert(car({
      battery: 55,
      chargingState: 'Disconnected',
      latestChargeSession: { chargeStopReason: 'Error' },
    }), now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.CHARGE_FAILED);
  });

  it('does not treat a completed charge as a failure', () => {
    expect(evaluateOwnerAlert(car({ battery: 80, chargingState: 'Complete', chargeLimit: 80 }), now)).toBeNull();
  });

  it('fires unavailable when last sync is older than 6 hours', () => {
    const alert = evaluateOwnerAlert(car({
      state: 'asleep',
      battery: 70,
      syncedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
    }), now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.VEHICLE_UNAVAILABLE);
    expect(alert.action).toBe('open');
    expect(alert.body).toMatch(/not woken/i);
  });

  it('does not wake-check a recently synced asleep car', () => {
    expect(evaluateOwnerAlert(car({
      state: 'asleep',
      battery: 70,
      syncedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    }), now)).toBeNull();
  });

  it('prefers battery_low over charge_failed and unavailable', () => {
    const alert = pickPrimaryOwnerAlert([
      car({
        battery: 9,
        chargingState: 'Error',
        state: 'offline',
        syncedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      }),
    ], now);
    expect(alert.trigger).toBe(OWNER_ALERT_TRIGGERS.BATTERY_LOW);
  });

  it('rate-limits the same VIN + trigger for several hours', () => {
    expect(isOwnerAlertCooldownActive(new Date(now.getTime() - 60 * 60 * 1000), now)).toBe(true);
    expect(isOwnerAlertCooldownActive(new Date(now.getTime() - 5 * 60 * 60 * 1000), now)).toBe(false);
  });
});
