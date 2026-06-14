import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isExplicitLandingHash } from './useHashRoute';

describe('landing hash helpers', () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('treats #/landing as explicit landing', () => {
    window.location.hash = '#/landing';
    expect(isExplicitLandingHash()).toBe(true);
  });

  it('treats bare site entry as implicit before normalization', () => {
    window.location.hash = '';
    expect(isExplicitLandingHash()).toBe(false);
  });
});
