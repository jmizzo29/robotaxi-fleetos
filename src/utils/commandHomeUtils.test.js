import { describe, it, expect } from 'vitest';
import {
  getCommandAiPlan,
  getCommandStatusBoard,
  getFleetActivityFeed,
  getFleetVisibilityRows,
  getOpenActionsBreakdown,
} from './commandHomeUtils';

const fleet = [
  { id: 'TSLA-481', name: 'TSLA-481', status: 'IN SERVICE', battery: 81, revenue: 47, utilization: 72, isReal: true, maintenanceScore: 74 },
  { id: 'RBT-229', name: 'RBT-229', status: 'PARKED', battery: 58, revenue: 0, utilization: 48, isReal: false, maintenanceScore: 82 },
];

describe('getCommandStatusBoard', () => {
  it('returns operational status cells', () => {
    const board = getCommandStatusBoard(fleet, [fleet[0]], 'success', [], 47);
    expect(board.active.value).toBe('1/1');
    expect(board.realTesla.value).toBe('1');
    expect(board.utilization.value).toBe('72%');
  });
});

describe('getOpenActionsBreakdown', () => {
  it('categorizes queued commands', () => {
    const breakdown = getOpenActionsBreakdown(
      [{ command: 'Review dynamic Turo pricing recommendations' }],
      fleet,
      [fleet[0]],
    );
    expect(breakdown.pricing).toBeGreaterThan(0);
  });
});

describe('getCommandAiPlan', () => {
  it('builds an operations brief with action and demand metrics', () => {
    const plan = getCommandAiPlan(fleet, [fleet[0]], { state: 'success' }, []);
    expect(plan.summary.length).toBeGreaterThan(0);
    expect(plan.action.length).toBeGreaterThan(0);
    expect(plan.demandIncrease).toMatch(/^\+/);
    expect(plan.expectedRevenueImpact).toMatch(/^\+\$/);
    expect(plan.confidenceLabel).toBeTruthy();
  });

  it('does not invent Orlando demand dollars for a Tesla without utilization', () => {
    const real = [{ id: 'tesla-1', status: 'PARKED', revenue: 0, isReal: true, display_name: 'Model Y' }];
    const plan = getCommandAiPlan(real, real, { state: 'success' }, []);
    expect(plan.summary).toMatch(/verified trips/i);
    expect(plan.action).toMatch(/telemetry/i);
    expect(plan.demandIncrease).toBe('—');
    expect(plan.expectedRevenueImpact).toBe('—');
  });
});

describe('getFleetActivityFeed', () => {
  it('returns activity events with impact and timestamp', () => {
    const events = getFleetActivityFeed(fleet, [fleet[0]], 3, 47, 'success');
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].description).toBeTruthy();
    expect(events[0].impact).toBeTruthy();
    expect(events[0].timestamp).toBeTruthy();
  });

  it('prefers synced real fleet over simulated activity when revenue is untrusted', () => {
    const simulatedFleet = [
      { id: 'CAR-007', status: 'PICKUP', revenue: 4100, utilization: 80, isReal: false, city: 'Orlando' },
      { id: 'TSLA-1', status: 'PARKED', revenue: 0, isReal: true, display_name: 'Model Y' },
    ];
    const events = getFleetActivityFeed(simulatedFleet, [simulatedFleet[1]], 5, 0, 'success');
    expect(events.some((event) => event.description.includes('CAB-007'))).toBe(false);
  });

  it('does not invent CAB-07 / MCO surge rows when the feed is empty', () => {
    const real = [{ id: 'tesla-1', status: 'PARKED', revenue: 0, isReal: true, display_name: 'Model Y' }];
    const events = getFleetActivityFeed(real, real, 5, 0, 'success');
    expect(events).toEqual([]);
    expect(events.some((event) => /CAB-07|MCO \+24%|Ready in 22 min/.test(`${event.vehicleName} ${event.impact}`))).toBe(false);
  });

  it('does not invent a demand surge from a missing utilization default', () => {
    const real = [{ id: 'tesla-1', status: 'ONLINE', revenue: 0, isReal: true, display_name: 'Model Y' }];
    const events = getFleetActivityFeed(real, real, 5, 0, 'success');
    expect(events.some((event) => event.eventType === 'surge')).toBe(false);
  });
});

describe('getFleetVisibilityRows', () => {
  it('returns operational visibility lines', () => {
    const rows = getFleetVisibilityRows(fleet, [fleet[0]], 2);
    expect(rows[0].status).toBeTruthy();
    expect(rows[0].line.length).toBeGreaterThan(0);
  });
});
