import { describe, it, expect } from 'vitest';
import { maskVin, canRevealVin } from './vinPrivacy';

describe('vinPrivacy (security)', () => {
  it('masks full VIN correctly', () => {
    expect(maskVin('5YJ3E1EA7KF123456')).toBe('5YJ3...3456');
  });

  it('returns short VIN as-is', () => {
    expect(maskVin('ABC123')).toBe('ABC123');
  });

  it('handles empty/null', () => {
    expect(maskVin('')).toBe('VIN unavailable');
    expect(maskVin(null)).toBe('VIN unavailable');
  });

  it('canRevealVin returns false for short VINs', () => {
    expect(canRevealVin('123')).toBe(false);
    expect(canRevealVin('5YJ3E1EA7KF')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(maskVin('5yj3e1ea7kf123456')).toBe('5YJ3...3456');
  });
});
