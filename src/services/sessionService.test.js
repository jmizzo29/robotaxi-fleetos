import { describe, expect, it } from 'vitest';
import { sessionCheckFromError, sessionCheckFromPayload } from './sessionService';

describe('sessionCheckFromError', () => {
  it('fails closed to guest on non-401 server errors', () => {
    expect(sessionCheckFromError({ status: 500 })).toBe('guest');
    expect(sessionCheckFromError({ status: 503 })).toBe('guest');
    expect(sessionCheckFromError(new TypeError('Failed to fetch'))).toBe('guest');
  });

  it('treats 401 as guest and never as authed', () => {
    expect(sessionCheckFromError({ status: 401 })).toBe('guest');
  });

  it('never fail-opens Command', () => {
    expect(sessionCheckFromError({ status: 500 })).not.toBe('authed');
    expect(sessionCheckFromError(undefined)).not.toBe('authed');
  });
});

describe('sessionCheckFromPayload', () => {
  it('requires an authenticated session payload', () => {
    expect(sessionCheckFromPayload({ authenticated: true })).toBe('authed');
    expect(sessionCheckFromPayload({ authenticated: false })).toBe('guest');
    expect(sessionCheckFromPayload(null)).toBe('guest');
  });
});
