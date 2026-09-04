import { describe, expect, it } from 'vitest';
import {
  TESLA_CONNECT_ENTRY_ROUTES,
  shouldRestoreConnectedSessionToCommand,
} from './teslaLaunchRoutes';

describe('tesla launch restore routes', () => {
  it('skips launch screens to Command when Tesla is already connected', () => {
    expect(shouldRestoreConnectedSessionToCommand('landing')).toBe(true);
    expect(shouldRestoreConnectedSessionToCommand('onboarding')).toBe(true);
    expect(TESLA_CONNECT_ENTRY_ROUTES.has('add-vehicle')).toBe(false);
  });

  it('keeps Add a vehicle on the connect/add page instead of bouncing to Command', () => {
    expect(shouldRestoreConnectedSessionToCommand('add-vehicle')).toBe(false);
    expect(shouldRestoreConnectedSessionToCommand('overview')).toBe(false);
    expect(shouldRestoreConnectedSessionToCommand('integrations')).toBe(false);
  });
});
