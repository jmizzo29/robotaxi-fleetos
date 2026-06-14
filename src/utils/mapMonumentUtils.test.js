import { describe, expect, it } from 'vitest';
import { getMapFooterLine, getMapMonumentHero } from './mapMonumentUtils';

const fleet = [
  { id: 'CAR-001', status: 'EN ROUTE', city: 'Orlando, FL', latitude: 28.5, longitude: -81.3 },
  { id: 'CAR-002', status: 'IDLE', city: 'Orlando, FL', latitude: 28.4, longitude: -81.4 },
];

describe('mapMonumentUtils', () => {
  it('returns active/total hero counts', () => {
    const hero = getMapMonumentHero(fleet, [], 0, 'idle');
    expect(hero.label).toBe('MAP');
    expect(hero.amount).toMatch(/\d+\/\d+/);
  });

  it('mentions en-route CAB in footer when moving', () => {
    const line = getMapFooterLine(fleet, [], 0, 'idle');
    expect(line).toContain('en route');
  });
});
