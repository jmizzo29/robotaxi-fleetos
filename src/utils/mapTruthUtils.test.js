import { describe, expect, it } from 'vitest';
import {
  getMapEmptyCopy,
  getMapLocatedVehicles,
  getMapTruthSource,
  getMapVehicleLabel,
  getMapViewState,
  isDemoMapVehicle,
  shouldShowMapDemoOverlays,
} from './mapTruthUtils';

const demoFleet = [
  { id: 'CAR-001', isReal: false, latitude: 28.5, longitude: -81.3, name: 'CAR-001' },
  { id: 'CAR-002', isReal: false, latitude: 28.4, longitude: -81.4 },
];

const realParked = {
  id: 'tesla-1',
  isReal: true,
  display_name: 'Model Y',
  status: 'PARKED',
  latitude: 30.2672,
  longitude: -97.7431,
};

const realNoGps = {
  id: 'tesla-2',
  isReal: true,
  display_name: 'Model 3',
  status: 'ONLINE',
};

describe('getMapTruthSource', () => {
  it('never returns CAR-001 demo pins for a connected owner', () => {
    const source = getMapTruthSource([...demoFleet, realParked], [realParked], { mock: false });
    expect(source).toEqual([realParked]);
    expect(source.some(isDemoMapVehicle)).toBe(false);
  });

  it('returns an empty source when Tesla is linked but has no vehicles', () => {
    expect(getMapTruthSource(demoFleet, [], { mock: false })).toEqual([]);
  });

  it('keeps demo pins only for explicit mock preview', () => {
    const source = getMapTruthSource(demoFleet, [], { mock: true });
    expect(source.map((vehicle) => vehicle.id)).toEqual(['CAR-001', 'CAR-002']);
  });
});

describe('map overlay and empty states', () => {
  it('hides mock network overlays on the default path', () => {
    expect(shouldShowMapDemoOverlays(false)).toBe(false);
    expect(shouldShowMapDemoOverlays(true)).toBe(true);
  });

  it('reports honest empty when a linked Tesla has no GPS', () => {
    const source = getMapTruthSource([realNoGps], [realNoGps], { mock: false });
    const located = getMapLocatedVehicles(source);
    expect(located).toEqual([]);
    const copy = getMapEmptyCopy({
      teslaConnected: true,
      sourceCount: source.length,
      locatedCount: located.length,
    });
    expect(copy.title).toMatch(/no gps/i);
    expect(copy.body).not.toMatch(/orlando|cybercab|CAR-001/i);
  });

  it('does not invent CAB labels for owner vehicles', () => {
    expect(getMapVehicleLabel(realParked, 0, { mock: false })).toBe('Model Y');
    expect(getMapVehicleLabel(demoFleet[0], 0, { mock: false })).not.toMatch(/^CAB-/);
    expect(getMapVehicleLabel(demoFleet[0], 0, { mock: true })).toBe('CAB-001');
  });

  it('centers on real GPS instead of Orlando when a Tesla has coordinates', () => {
    const view = getMapViewState([realParked], { mock: false });
    expect(view.latitude).toBeCloseTo(30.2672);
    expect(view.longitude).toBeCloseTo(-97.7431);
  });
});
