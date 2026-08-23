import { describe, expect, it } from 'vitest';
import { isMissingChargingScope } from '../services/teslaChargingService';

describe('missing charging scope detection', () => {
  it('treats Tesla missing-scope errors as a reconnect, not an app failure', () => {
    expect(isMissingChargingScope({ code: 'MISSING_CHARGING_SCOPE' })).toBe(true);
    expect(isMissingChargingScope({ message: 'missing scopes: vehicle_charging_cmds' })).toBe(true);
    expect(isMissingChargingScope({ message: 'vehicle asleep' })).toBe(false);
  });
});
