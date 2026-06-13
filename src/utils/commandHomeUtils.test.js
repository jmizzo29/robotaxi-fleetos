import { describe, it, expect } from 'vitest';
import {
  getCommandAiPlan,
  getCommandStatusBoard,
  getFleetVisibilityRows,
  getOpenActionsBreakdown,
} from './commandHomeUtils';

const fleet = [
  { id: 'TSLA-481', name: 'TSLA-481', status: 'IN SERVICE', battery: 81, revenue: 47, utilization: 72, isReal: true, maintenanceScore: 74 },
  { id: 'RBT-229', name: 'RBT-229', status: 'PARKED', battery: 58, revenue: 0, utilization: 48, isReal: false, maintenanceScore: 82 },
];

describe('getCommandStatusBoard', () => {
  it('returns operational status cells', () => {
    const board = getCommandStatusBoard(fleet, [fleet[0]], 'success', []);
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
  it('builds a summary and checklist', () => {
    const plan = getCommandAiPlan(fleet, [fleet[0]], { state: 'success' }, []);
    expect(plan.summary.length).toBeGreaterThan(0);
    expect(plan.checklist.length).toBeGreaterThan(0);
  });
});

describe('getFleetVisibilityRows', () => {
  it('returns operational visibility lines', () => {
    const rows = getFleetVisibilityRows(fleet, [fleet[0]], 2);
    expect(rows[0].line).toMatch(/battery/i);
  });
});
