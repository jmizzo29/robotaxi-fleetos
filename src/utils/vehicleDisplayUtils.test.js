import { describe, it, expect } from 'vitest';
import {
  getFleetHeroMetric,
  getFleetRecommendation,
  getFleetSnapshotCounts,
  hasTrustedFleetRevenue,
} from './vehicleDisplayUtils';

const onlineVehicle = { name: 'Model 3', status: 'ONLINE', battery: 81, revenue: 0, utilization: 72 };
const earningVehicle = { name: 'Model 3', status: 'ONLINE', battery: 81, revenue: 482, utilization: 72 };
const lowBatteryVehicle = { name: 'Model Y', status: 'ONLINE', battery: 15, revenue: 0, utilization: 40 };
const chargingVehicle = { name: 'Model X', status: 'CHARGING', battery: 55, revenue: 0, utilization: 30 };
const idleVehicle = { name: 'Model S', status: 'PARKED', battery: 70, revenue: 0, utilization: 18 };

describe('hasTrustedFleetRevenue', () => {
  it('returns false for zero revenue', () => {
    expect(hasTrustedFleetRevenue([onlineVehicle], 0, 'success')).toBe(false);
  });

  it('returns false when sync is not successful', () => {
    expect(hasTrustedFleetRevenue([earningVehicle], 482, 'idle')).toBe(false);
  });

  it('returns true when real vehicles have positive revenue and sync succeeded', () => {
    expect(hasTrustedFleetRevenue([earningVehicle], 482, 'success')).toBe(true);
  });
});

describe('getFleetHeroMetric', () => {
  it('shows revenue when trusted and meaningful', () => {
    const hero = getFleetHeroMetric({
      realFleet: [earningVehicle],
      totalEarnings: 482,
      syncState: 'success',
    });
    expect(hero.value).toBe('$482');
    expect(hero.label).toBe("Today's Revenue");
  });

  it('never shows $0 revenue', () => {
    const hero = getFleetHeroMetric({
      realFleet: [onlineVehicle],
      totalEarnings: 0,
      syncState: 'success',
    });
    expect(hero.value).toBe('1 / 1');
    expect(hero.label).toBe('Fleet Online');
  });

  it('falls back to fleet online when revenue is not trusted', () => {
    const hero = getFleetHeroMetric({
      realFleet: [onlineVehicle],
      totalEarnings: 482,
      syncState: 'success',
    });
    expect(hero.value).toBe('1 / 1');
    expect(hero.label).toBe('Fleet Online');
  });
});

describe('getFleetRecommendation', () => {
  it('prioritizes alerts over charging', () => {
    const rec = getFleetRecommendation([lowBatteryVehicle, chargingVehicle], { state: 'success' });
    expect(rec.title).toBe('Low battery alert');
  });

  it('shows idle recommendation when no alerts', () => {
    const idleOnly = { name: 'Model S', status: 'PARKED', battery: 85, revenue: 0, utilization: 18 };
    const rec = getFleetRecommendation([idleOnly], { state: 'success' });
    expect(rec.title).toBe('Model S underutilized');
  });

  it('shows all clear when fleet is healthy', () => {
    const rec = getFleetRecommendation([onlineVehicle], { state: 'success' });
    expect(rec.title).toBe('All clear');
  });
});

describe('getFleetSnapshotCounts', () => {
  it('counts online, charging, offline, and alerts', () => {
    const counts = getFleetSnapshotCounts([onlineVehicle, chargingVehicle, lowBatteryVehicle]);
    expect(counts.online).toBe(2);
    expect(counts.charging).toBe(1);
    expect(counts.offline).toBe(0);
    expect(counts.alerts).toBe(1);
  });
});
