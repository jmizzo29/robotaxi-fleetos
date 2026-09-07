import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTeslaLoginUrl, startTeslaOAuth } from './teslaHealthService';

describe('getTeslaLoginUrl', () => {
  it('points at the Tesla login API with a return hash', () => {
    const url = getTeslaLoginUrl('overview');
    expect(url).toContain('/tesla/login?');
    expect(url).toContain('returnTo=');
    expect(url).toContain('overview');
  });
});

describe('startTeslaOAuth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('navigates to Tesla login instead of no-op', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', {
      location: {
        origin: 'https://roboagent-fleet.vercel.app',
        pathname: '/',
        replace,
      },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const result = startTeslaOAuth('overview');
    expect(result.ok).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0][0]).toContain('/tesla/login?');
  });

  it('returns a clear error instead of failing silently', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://example.com', pathname: '/', replace: undefined },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const result = startTeslaOAuth('overview');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not available/i);
  });
});
