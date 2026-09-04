import { describe, expect, it } from 'vitest';
import { mergeWithSimulation } from './teslaService';

const demoFleet = [
  { id: 'CAR-001', isReal: false, revenue: 4822, utilization: 72, city: 'Lakeland' },
  { id: 'CAR-002', isReal: false, revenue: 3910, utilization: 64, city: 'Orlando' },
];

describe('mergeWithSimulation', () => {
  it('returns only real Teslas and never appends CAR-001–004', () => {
    const real = [{ id: 'abc', vin: '5YJ3', display_name: 'Model Y', state: 'online', battery: 81 }];
    const merged = mergeWithSimulation(real, demoFleet);
    expect(merged).toHaveLength(1);
    expect(merged[0].isReal).toBe(true);
    expect(merged.some((vehicle) => String(vehicle.id).startsWith('CAR-'))).toBe(false);
  });

  it('does not invent utilization that would trigger a demand surge', () => {
    const real = [{ id: 'abc', vin: '5YJ3', display_name: 'Model Y', state: 'parked', battery: 81 }];
    const [vehicle] = mergeWithSimulation(real, demoFleet);
    expect(vehicle.utilization).toBeUndefined();
    expect(vehicle.revenue).toBe(0);
  });

  it('drops demo cars when Tesla sync returns no vehicles', () => {
    expect(mergeWithSimulation([], demoFleet)).toEqual([]);
    expect(mergeWithSimulation(null, demoFleet)).toEqual([]);
  });

  it('keeps previously synced Teslas when a later sync is empty', () => {
    const previous = [{ id: 'tesla-1', vin: '5YJ3', isReal: true, display_name: 'Model Y' }];
    expect(mergeWithSimulation([], [...previous, ...demoFleet])).toEqual(previous);
  });
});
