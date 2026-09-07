import { describe, expect, it } from 'vitest';
import { getMapFooterLine, getMapMonumentHero } from './mapMonumentUtils';

const demoFleet = [
  { id: 'CAR-001', status: 'EN ROUTE', city: 'Orlando, FL', latitude: 28.5, longitude: -81.3 },
  { id: 'CAR-002', status: 'IDLE', city: 'Orlando, FL', latitude: 28.4, longitude: -81.4 },
];

const realTesla = {
  id: 'tesla-1',
  isReal: true,
  display_name: 'Model Y',
  status: 'PARKED',
  city: 'Austin, TX',
  latitude: 30.2672,
  longitude: -97.7431,
};

describe('mapMonumentUtils', () => {
  it('does not count demo cars as live map inventory', () => {
    const hero = getMapMonumentHero(demoFleet, [], 0, 'idle');
    expect(hero.label).toBe('MAP');
    expect(hero.amount).toBe('0/0');
    expect(hero.subline).toMatch(/no vehicles/i);
  });

  it('shows real Tesla GPS in the hero and footer', () => {
    const hero = getMapMonumentHero(demoFleet, [realTesla], 0, 'success');
    expect(hero.amount).toBe('1/1');
    expect(hero.subline).toMatch(/austin/i);
    expect(hero.subline).not.toMatch(/orlando/i);

    const line = getMapFooterLine(demoFleet, [realTesla], 0, 'success');
    expect(line).toMatch(/Model Y/i);
    expect(line).toMatch(/Austin/i);
    expect(line).not.toMatch(/CAB-0|MCO|CAR-001/i);
  });

  it('never invents an MCO en-route line for owners', () => {
    const line = getMapFooterLine(demoFleet, [], 0, 'idle');
    expect(line).not.toMatch(/CAB-|MCO/i);
    expect(line).toMatch(/connect tesla|no vehicle/i);
  });

  it('labels mock preview honestly', () => {
    const hero = getMapMonumentHero(demoFleet, [], 0, 'idle', { mock: true });
    expect(hero.subline).toMatch(/demo preview/i);
    const line = getMapFooterLine(demoFleet, [], 0, 'idle', { mock: true });
    expect(line).toMatch(/demo preview/i);
  });
});
