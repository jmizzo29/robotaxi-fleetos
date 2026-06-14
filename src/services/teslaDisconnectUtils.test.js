import { describe, it, expect } from 'vitest';
import { mapTeslaDisconnectError } from './teslaDisconnectUtils';

describe('mapTeslaDisconnectError', () => {
  it('maps login required', () => {
    expect(mapTeslaDisconnectError({ code: 'LOGIN_REQUIRED', status: 401 }))
      .toMatch(/Sign in to ROBOAGENT/);
  });

  it('maps database required', () => {
    expect(mapTeslaDisconnectError({ code: 'DATABASE_REQUIRED', status: 503 }))
      .toMatch(/account storage is unavailable/);
  });

  it('maps no active connection', () => {
    expect(mapTeslaDisconnectError({ code: 'NO_ACTIVE_CONNECTION' }))
      .toBe('No active Tesla connection found.');
  });

  it('maps network failures', () => {
    expect(mapTeslaDisconnectError({ status: 0, message: 'Failed to fetch' }))
      .toMatch(/Unable to reach ROBOAGENT services/);
  });
});
