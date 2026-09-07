import { describe, expect, it } from 'vitest';
import { isTeslaOAuthConfigured, oauthStartErrorPage } from './teslaConfig.js';

describe('isTeslaOAuthConfigured', () => {
  it('is true when TESLA_CLIENT_ID is present, even without a user connection', () => {
    expect(isTeslaOAuthConfigured({ TESLA_CLIENT_ID: '52aa6497-b562-4e11-9c0a-aaaaaaaaaaaa' })).toBe(true);
  });

  it('is false when TESLA_CLIENT_ID is missing', () => {
    expect(isTeslaOAuthConfigured({})).toBe(false);
    expect(isTeslaOAuthConfigured({ TESLA_CLIENT_ID: '' })).toBe(false);
  });
});

describe('oauthStartErrorPage', () => {
  it('renders a visible error instead of bouncing to /#/login', () => {
    const html = oauthStartErrorPage('TESLA_CLIENT_ID is required for Tesla OAuth.');
    expect(html).toContain('Could not start Tesla OAuth');
    expect(html).toContain('TESLA_CLIENT_ID is required for Tesla OAuth.');
  });

  it('escapes unexpected markup in the message', () => {
    const html = oauthStartErrorPage('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
