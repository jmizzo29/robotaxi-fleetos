import { describe, expect, it } from 'vitest';
import {
  ALLOWED_APP_ORIGINS,
  CANONICAL_APP_ORIGIN,
  LEGACY_APP_ORIGINS,
  isKnownAppHost,
  teslaCallbackUrl,
} from './publicAppOrigins';

describe('publicAppOrigins', () => {
  it('treats the Vercel production host as canonical', () => {
    expect(CANONICAL_APP_ORIGIN).toBe('https://roboagent-fleet.vercel.app');
    expect(teslaCallbackUrl()).toBe('https://roboagent-fleet.vercel.app/api/tesla/callback');
  });

  it('keeps autofleeto.com as a temporary extra origin, not the product URL', () => {
    expect(LEGACY_APP_ORIGINS).toEqual([
      'https://www.autofleeto.com',
      'https://autofleeto.com',
    ]);
    expect(ALLOWED_APP_ORIGINS).toContain(CANONICAL_APP_ORIGIN);
    expect(ALLOWED_APP_ORIGINS).toEqual(expect.arrayContaining(LEGACY_APP_ORIGINS));
  });

  it('recognizes both the new host and leftover autofleeto bookmarks', () => {
    expect(isKnownAppHost('https://roboagent-fleet.vercel.app/#/landing')).toBe(true);
    expect(isKnownAppHost('https://www.autofleeto.com')).toBe(true);
    expect(isKnownAppHost('http://localhost:5173')).toBe(false);
  });
});
