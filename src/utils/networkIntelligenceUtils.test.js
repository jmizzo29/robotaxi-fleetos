import { describe, it, expect } from 'vitest';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from './vehicleDisplayUtils';
import {
  getExpansionRecommendation,
  getNetworkOpportunities,
} from './networkIntelligenceUtils';

const fleet = [
  { id: 'TSLA-481', status: 'IN SERVICE', battery: 81, revenue: 120, utilization: 72, isReal: true, city: 'Orlando' },
  { id: 'TSLA-482', status: 'CHARGING', battery: 58, revenue: 45, isReal: true, city: 'Orlando' },
  { id: 'RBT-229', status: 'OFFLINE', battery: 12, revenue: 0, isReal: false, city: 'Tampa' },
];

describe('getCommandEarningsHero', () => {
  it('returns net earnings, trips, and tesla share when revenue is trusted', () => {
    const hero = getCommandEarningsHero([fleet[0], fleet[1]], 165, 'success');
    expect(hero.amount).toBe('$165');
    expect(hero.label).toBe('Net Earnings Today');
    expect(Number(hero.trips)).toBeGreaterThan(0);
    expect(hero.teslaShare).toBe('$165');
  });
});

describe('getCommandFleetStatusStrip', () => {
  it('counts active, charging, and offline vehicles', () => {
    const strip = getCommandFleetStatusStrip(fleet, [fleet[0], fleet[1]]);
    expect(strip.active.value).toBe('1');
    expect(strip.charging.value).toBe('1');
    expect(strip.offline.value).toBe('0');
  });
});

describe('getNetworkOpportunities', () => {
  it('returns event-driven opportunities', () => {
    const items = getNetworkOpportunities(fleet);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({ title: expect.any(String), demandLabel: expect.any(String) });
  });
});

describe('getExpansionRecommendation', () => {
  it('returns Orlando expansion projection', () => {
    const expansion = getExpansionRecommendation(fleet);
    expect(expansion.city).toBe('Orlando');
    expect(expansion.projectedLabel).toMatch(/^\+\$/);
  });
});
