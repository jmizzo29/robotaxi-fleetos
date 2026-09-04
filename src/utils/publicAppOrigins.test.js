import { describe, expect, it } from 'vitest';
import {
  ALLOWED_APP_ORIGINS,
  CANONICAL_APP_ORIGIN,
  CANONICAL_TESLA_REDIRECT_URI,
  LEGACY_APP_ORIGINS,
  isKnownAppHost,
  resolveTeslaRedirectUri,
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

  it('always resolves Tesla OAuth to one registered callback, ignoring request host', () => {
    expect(CANONICAL_TESLA_REDIRECT_URI).toBe('https://roboagent-fleet.vercel.app/api/tesla/callback');
    expect(resolveTeslaRedirectUri()).toBe(CANONICAL_TESLA_REDIRECT_URI);
    expect(resolveTeslaRedirectUri({
      teslaRedirectUri: 'https://roboagent-fleet.vercel.app/api/tesla/callback/',
    })).toBe(CANONICAL_TESLA_REDIRECT_URI);
    expect(resolveTeslaRedirectUri({
      teslaRedirectUri: 'http://localhost:3001/callback',
      publicAppUrl: 'https://roboagent-fleet.vercel.app',
    })).toBe(CANONICAL_TESLA_REDIRECT_URI);
    expect(resolveTeslaRedirectUri({
      publicAppUrl: 'https://roboagent-fleet.vercel.app/',
    })).toBe(CANONICAL_TESLA_REDIRECT_URI);
  });
});
