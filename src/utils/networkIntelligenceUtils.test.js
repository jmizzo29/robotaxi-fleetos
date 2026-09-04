import { describe, it, expect } from 'vitest';
import {
  getCommandEarningsHero,
  getCommandFleetStatusStrip,
} from './vehicleDisplayUtils';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getGrowHero,
  getNetworkOpportunities,
} from './networkIntelligenceUtils';

const fleet = [
  { id: 'TSLA-481', status: 'IN SERVICE', battery: 81, revenue: 120, utilization: 72, isReal: true, city: 'Orlando' },
  { id: 'TSLA-482', status: 'CHARGING', battery: 58, revenue: 45, isReal: true, city: 'Orlando' },
  { id: 'RBT-229', status: 'OFFLINE', battery: 12, revenue: 0, isReal: false, city: 'Tampa' },
];

describe('getCommandEarningsHero', () => {
  it('returns net earnings and tesla share when revenue is trusted', () => {
    const hero = getCommandEarningsHero(fleet, [fleet[0], fleet[1]], 165, 'success');
    expect(hero.amount).toBe('$165');
    expect(hero.label).toBe('Net Earnings Today');
    expect(hero.trips).toBe('—');
    expect(hero.teslaShare).toBe('$165');
    expect(hero.netMargin).toBe('—');
    expect(hero.operational).toBe(false);
  });

  it('does not project earnings when Tesla is linked but revenue is not trusted', () => {
    const simulatedFleet = [
      ...fleet,
      { id: 'CAR-007', status: 'EN ROUTE', revenue: 4200, utilization: 74, isReal: false, city: 'Orlando' },
      { id: 'CAR-002', status: 'CHARGING', revenue: 3100, utilization: 61, isReal: false, city: 'Orlando' },
    ];
    const hero = getCommandEarningsHero(simulatedFleet, [{ ...fleet[0], revenue: 0 }], 0, 'success');
    expect(hero.amount).toBe('—');
    expect(hero.trips).toBe('—');
    expect(hero.operational).toBe(false);
    expect(hero.label).toBe('Net Earnings Today');
    expect(hero.hint).toMatch(/no verified trips/i);
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
  it('does not invent live personal demand events for a connected owner', () => {
    const items = getNetworkOpportunities(fleet);
    expect(items).toEqual([]);
  });

  it('labels catalog events as illustrative preview only', () => {
    const items = getNetworkOpportunities(fleet, { illustrative: true });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].illustrative).toBe(true);
    expect(items[0].disclaimer).toMatch(/not live personal intelligence/i);
  });
});

describe('getExpansionScoreboard', () => {
  it('hides hardcoded scores from owner surfaces', () => {
    expect(getExpansionScoreboard()).toEqual([]);
  });

  it('returns ranked Florida markets only as illustrative preview', () => {
    const board = getExpansionScoreboard({ illustrative: true });
    expect(board[0].city).toBe('Orlando');
    expect(board[0].score).toBeGreaterThan(board[1].score);
    expect(board[0].illustrative).toBe(true);
  });
});

describe('getExpansionRecommendation', () => {
  it('does not invent weekly or monthly dollars for a connected owner', () => {
    const expansion = getExpansionRecommendation(fleet);
    expect(expansion.empty).toBe(true);
    expect(expansion.projectedMonthly).toBeNull();
    expect(expansion.projectedLabel).toBe('—');
    expect(expansion.city).toBeNull();
  });
});

describe('getGrowHero', () => {
  it('renders an em dash instead of +$700/week for empty intel', () => {
    const hero = getGrowHero(getExpansionRecommendation(fleet));
    expect(hero.amount).toBe('—');
    expect(hero.subline).toMatch(/no personal weekly forecast/i);
    expect(hero.line).not.toMatch(/\$700|Taylor Swift/i);
  });
});
