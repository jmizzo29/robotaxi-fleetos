import { describe, expect, it } from 'vitest';
import {
  createDeleteConfirmToken,
  DELETE_CONFIRMATION_PHRASE,
  isProductionRuntime,
  isValidDeleteConfirmation,
  resolveMissingSession,
  teslaLoginMayCreateSession,
  vehiclesDebugAccess,
  verifyDeleteConfirmToken,
} from './prodGuards.js';

describe('vehiclesDebugAccess', () => {
  it('rejects anonymous debug in any environment', () => {
    const access = vehiclesDebugAccess({ debug: '1', authenticated: false, production: false });
    expect(access.allow).toBe(false);
    expect(access.status).toBe(401);
    expect(access.error).toBe('LOGIN_REQUIRED');
  });

  it('removes debug entirely in production even when authenticated', () => {
    const access = vehiclesDebugAccess({ debug: '1', authenticated: true, production: true });
    expect(access.allow).toBe(false);
    expect(access.status).toBe(404);
  });

  it('allows authenticated non-production debug without leaking to guests', () => {
    expect(vehiclesDebugAccess({ debug: '1', authenticated: true, production: false }).allow).toBe(true);
    expect(vehiclesDebugAccess({ debug: undefined, authenticated: false, production: false }).allow).toBe(false);
  });
});

describe('isProductionRuntime', () => {
  it('treats NODE_ENV or VERCEL_ENV production as production', () => {
    expect(isProductionRuntime({ NODE_ENV: 'production' })).toBe(true);
    expect(isProductionRuntime({ VERCEL_ENV: 'production' })).toBe(true);
    expect(isProductionRuntime({ NODE_ENV: 'test' })).toBe(false);
  });
});

describe('resolveMissingSession', () => {
  it('never mints a guest session when Clerk is required', () => {
    expect(resolveMissingSession({ clerkRequired: true, create: true }).action).toBe('deny');
    expect(resolveMissingSession({
      clerkRequired: true,
      create: true,
      clerkError: Object.assign(new Error('Sign in'), { status: 401 }),
    }).action).toBe('deny');
  });

  it('still allows Tesla-first anonymous mint when Clerk is not required', () => {
    expect(resolveMissingSession({ clerkRequired: false, create: true }).action).toBe('mint');
    expect(resolveMissingSession({ clerkRequired: false, create: false }).action).toBe('deny');
  });

  it('rethrows unexpected Clerk failures', () => {
    const clerkError = Object.assign(new Error('Clerk down'), { status: 500 });
    const result = resolveMissingSession({ clerkRequired: true, create: false, clerkError });
    expect(result.action).toBe('throw');
    expect(result.error).toBe(clerkError);
  });
});

describe('teslaLoginMayCreateSession', () => {
  it('refuses a guest OAuth side door when Clerk is required', () => {
    expect(teslaLoginMayCreateSession({ clerkRequired: true, hasSession: false })).toBe(false);
    expect(teslaLoginMayCreateSession({ clerkRequired: true, hasSession: true })).toBe(false);
    expect(teslaLoginMayCreateSession({ clerkRequired: false, hasSession: false })).toBe(true);
    expect(teslaLoginMayCreateSession({ clerkRequired: false, hasSession: true })).toBe(false);
  });
});

describe('delete confirmation guards', () => {
  const env = { SESSION_SECRET: 'unit-test-delete-secret' };

  it('requires the typed DELETE phrase', () => {
    expect(isValidDeleteConfirmation('DELETE')).toBe(true);
    expect(isValidDeleteConfirmation('delete')).toBe(false);
    expect(isValidDeleteConfirmation('')).toBe(false);
    expect(DELETE_CONFIRMATION_PHRASE).toBe('DELETE');
  });

  it('issues a user-bound token that expires and cannot be reused for another user', () => {
    const now = 1_700_000_000_000;
    const issued = createDeleteConfirmToken('user-1', now, 60_000, env);
    expect(verifyDeleteConfirmToken('user-1', issued.token, now + 1_000, env)).toBe(true);
    expect(verifyDeleteConfirmToken('user-2', issued.token, now + 1_000, env)).toBe(false);
    expect(verifyDeleteConfirmToken('user-1', issued.token, now + 61_000, env)).toBe(false);
    expect(verifyDeleteConfirmToken('user-1', 'tampered.token', now + 1_000, env)).toBe(false);
  });
});
