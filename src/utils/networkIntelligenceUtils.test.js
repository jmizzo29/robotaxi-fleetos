import { describe, it, expect } from 'vitest';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from './vehicleDisplayUtils';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from './networkIntelligenceUtils';

const fleet = [
  { id: 'TSLA-481', status: 'IN SERVICE', battery: 81, revenue: 120, utilization: 72, isReal: true, city: 'Orlando' },
  { id: 'TSLA-482', status: 'CHARGING', battery: 58, revenue: 45, isReal: true, city: 'Orlando' },
  { id: 'RBT-229', status: 'OFFLINE', battery: 12, revenue: 0, isReal: false, city: 'Tampa' },
];

describe('getCommandEarningsHero', () => {
  it('returns net earnings, trips, tesla share, and net margin when revenue is trusted', () => {
    const hero = getCommandEarningsHero(fleet, [fleet[0], fleet[1]], 165, 'success');
    expect(hero.amount).toBe('$165');
    expect(hero.label).toBe('Net Earnings Today');
    expect(Number(hero.trips)).toBeGreaterThan(0);
    expect(hero.teslaShare).toBe('$165');
    expect(hero.netMargin).toMatch(/%$/);
    expect(hero.operational).toBe(false);
  });

  it('shows operational earnings when Tesla is linked but revenue is not trusted', () => {
    const simulatedFleet = [
      ...fleet,
      { id: 'CAR-007', status: 'EN ROUTE', revenue: 4200, utilization: 74, isReal: false, city: 'Orlando' },
      { id: 'CAR-002', status: 'CHARGING', revenue: 3100, utilization: 61, isReal: false, city: 'Orlando' },
    ];
    const hero = getCommandEarningsHero(simulatedFleet, [{ ...fleet[0], revenue: 0 }], 0, 'success');
    expect(hero.amount).not.toBe('$0');
    expect(hero.amount).not.toBe('—');
    expect(Number(hero.trips)).toBeGreaterThan(0);
    expect(hero.operational).toBe(true);
    expect(hero.liveLabel).toBe('Operating');
    expect(hero.label).toBe('Projected Earnings Today');
    expect(hero.delta).toBeNull();
  });
});

describe('getCommandFleetStatusStrip', () => {
  it('counts active, charging, service, and offline vehicles with operational sublabels', () => {
    const strip = getCommandFleetStatusStrip(fleet, [fleet[0], fleet[1]], 165, 'success');
    expect(strip.service.value).toBe('1');
    expect(strip.charging.value).toBe('1');
    expect(strip.active.sub).toBeTruthy();
    expect(strip.offline.sub).toBe('Fleet Healthy');
  });

  it('counts synced real vehicles when revenue is not trusted', () => {
    const simulatedFleet = [
      { id: 'CAR-001', status: 'EN ROUTE', isReal: false },
      { id: 'CAR-002', status: 'CHARGING', isReal: false },
      { id: 'CAR-003', status: 'OFFLINE', isReal: false },
      { id: 'TSLA-1', status: 'PARKED', revenue: 0, isReal: true },
    ];
    const strip = getCommandFleetStatusStrip(simulatedFleet, [simulatedFleet[3]], 0, 'success');
    expect(strip.total).toBe(1);
    expect(Number(strip.active.value)).toBe(1);
    expect(Number(strip.charging.value)).toBe(0);
  });
});

describe('getNetworkOpportunities', () => {
  it('returns event-driven opportunities', () => {
    const items = getNetworkOpportunities(fleet);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({ title: expect.any(String), demandLabel: expect.any(String) });
  });
});

describe('getExpansionScoreboard', () => {
  it('returns ranked Florida markets', () => {
    const board = getExpansionScoreboard();
    expect(board[0].city).toBe('Orlando');
    expect(board[0].score).toBeGreaterThan(board[1].score);
  });
});

describe('getExpansionRecommendation', () => {
  it('returns Orlando expansion with monthly projection', () => {
    const expansion = getExpansionRecommendation(fleet);
    expect(expansion.city).toBe('Orlando');
    expect(expansion.projectedLabel).toMatch(/^\+\$/);
    expect(expansion.deployLabel).toContain('Deploy');
    expect(expansion.confidenceLabel).toBeTruthy();
  });
});
