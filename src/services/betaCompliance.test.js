import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasBetaAccess,
  verifyBetaInvite,
  hasTeslaConsent,
  acceptTeslaConsent,
  canUseTeslaTelemetry,
} from './betaCompliance';

describe('betaCompliance (security + trust)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  it('hasBetaAccess is false by default', () => {
    expect(hasBetaAccess()).toBe(false);
  });

  it('verifyBetaInvite grants access with correct code', () => {
    const result = verifyBetaInvite('RoboAgent-BETA');
    expect(result).toBe(true);
    expect(hasBetaAccess()).toBe(true);
  });

  it('verifyBetaInvite rejects wrong code', () => {
    expect(verifyBetaInvite('wrong-code')).toBe(false);
    expect(hasBetaAccess()).toBe(false);
  });

  it('Tesla consent flow works correctly', () => {
    expect(hasTeslaConsent()).toBe(false);
    const consent = acceptTeslaConsent();
    expect(hasTeslaConsent()).toBe(true);
    expect(consent.telemetry).toContain('VIN');
    expect(consent.version).toBe('beta-2026-05-22');
  });

  it('canUseTeslaTelemetry requires both beta access AND consent', () => {
    expect(canUseTeslaTelemetry()).toBe(false);
    verifyBetaInvite('RoboAgent-BETA');
    expect(canUseTeslaTelemetry()).toBe(false);
    acceptTeslaConsent();
    expect(canUseTeslaTelemetry()).toBe(true);
  });
});
