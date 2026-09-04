import { describe, expect, it } from 'vitest';
import { getAddVehicleCopy } from './addVehicleCopy';

describe('getAddVehicleCopy', () => {
  it('does not imply a second Tesla OAuth account when already connected', () => {
    const copy = getAddVehicleCopy({
      teslaConnected: true,
      billing: { coveredVehicles: 1, vehicleCount: 1, includedVehicles: 1 },
    });
    expect(copy.cta).toBe('Re-authorize Tesla account');
    expect(copy.body).toMatch(/one connection/i);
    expect(copy.body).toMatch(/does not create a second account/i);
    expect(copy.detail).toMatch(/plan coverage/i);
    expect(copy.cta).not.toMatch(/Connect Another Tesla/i);
    expect(copy.paywalled).toBe(false);
  });

  it('states the paywall when extra VINs exceed plan coverage', () => {
    const copy = getAddVehicleCopy({
      teslaConnected: true,
      billing: { coveredVehicles: 1, vehicleCount: 2, billingRequired: true },
    });
    expect(copy.paywalled).toBe(true);
    expect(copy.detail).toMatch(/paid vehicle plan/i);
    expect(copy.cta).not.toMatch(/Connect Another Tesla/i);
  });

  it('explains first Tesla free for a first connection', () => {
    const copy = getAddVehicleCopy({ teslaConnected: false, billing: { coveredVehicles: 1, vehicleCount: 0 } });
    expect(copy.cta).toBe('Connect Tesla');
    expect(copy.body).toMatch(/first Tesla/i);
    expect(copy.detail).toMatch(/does not invent a second ROBOAGENT account/i);
  });
});
