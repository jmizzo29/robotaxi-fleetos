import { describe, it, expect } from 'vitest';
import {
  getAlertsLedgerRows,
  getChargeLedgerRows,
  getOperationsConvoy,
  getOperationsHero,
  getPlanDetailPayload,
  routeToOperationsTab,
} from './operationsUtils';

const fleet = [
  { id: 'CAR-01', name: 'CAR-01', status: 'PARKED', battery: 38, city: 'Orlando, FL', isReal: false },
  { id: 'CAR-02', name: 'CAR-02', status: 'IN SERVICE', battery: 81, city: 'Orlando, FL', isReal: false },
  { id: 'CAR-09', name: 'CAR-09', status: 'OFFLINE', battery: 62, city: 'Orlando, FL', isReal: false },
];

describe('getOperationsConvoy', () => {
  it('returns convoy tile counts for O3 layout', () => {
    const convoy = getOperationsConvoy(fleet, [], 0, 'idle', { state: 'idle' }, []);
    expect(convoy.total).toBeGreaterThan(0);
    expect(convoy.actionCount).toBeGreaterThan(0);
    expect(convoy.plan).toBeGreaterThan(0);
    expect(convoy.city).toBe('Orlando');
  });
});

describe('getOperationsHero', () => {
  it('formats plan tab hero as action ratio', () => {
    const convoy = getOperationsConvoy(fleet, [], 0, 'idle', { state: 'idle' }, []);
    const hero = getOperationsHero(convoy, 'plan');
    expect(hero.label).toBe('OPERATIONS');
    expect(hero.amount).toMatch(/\d+\/\d+/);
    expect(hero.subline).toContain('Orlando');
  });

  it('formats charge tab hero as count', () => {
    const convoy = getOperationsConvoy(fleet, [], 0, 'idle', { state: 'idle' }, []);
    const hero = getOperationsHero(convoy, 'charge');
    expect(hero.label).toBe('CHARGE');
    expect(hero.amount).toMatch(/^\d+$/);
  });
});

describe('operations ledgers', () => {
  it('builds plan detail rows', () => {
    const payload = getPlanDetailPayload(fleet, [], 0, 'idle');
    expect(payload.rows.length).toBeGreaterThan(0);
    expect(payload.rows[0].cab).toMatch(/^CAB-/);
  });

  it('builds charge and alert rows', () => {
    const chargeRows = getChargeLedgerRows(fleet, [], 0, 'idle');
    const alertRows = getAlertsLedgerRows(fleet, [], 0, 'idle');
    expect(chargeRows.length).toBeGreaterThan(0);
    expect(alertRows.length).toBeGreaterThan(0);
  });
});

describe('routeToOperationsTab', () => {
  it('maps operations routes to swipe tabs', () => {
    expect(routeToOperationsTab('dispatch')).toBe('plan');
    expect(routeToOperationsTab('charging')).toBe('charge');
    expect(routeToOperationsTab('alerts')).toBe('alerts');
    expect(routeToOperationsTab('health')).toBe('plan');
  });
});
