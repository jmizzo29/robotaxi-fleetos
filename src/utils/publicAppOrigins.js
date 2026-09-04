/** Canonical public host for ROBOAGENT. autofleeto.com stays allowed, not canonical. */
export const CANONICAL_APP_ORIGIN = 'https://roboagent-fleet.vercel.app';
export const TEAM_PREVIEW_APP_ORIGIN = 'https://roboagent-fleet-git-main-jmizzo29s-projects.vercel.app';

export const LEGACY_APP_ORIGINS = [
  'https://www.autofleeto.com',
  'https://autofleeto.com',
];

export const ALLOWED_APP_ORIGINS = [
  CANONICAL_APP_ORIGIN,
  TEAM_PREVIEW_APP_ORIGIN,
  ...LEGACY_APP_ORIGINS,
];

export function teslaCallbackUrl(origin = CANONICAL_APP_ORIGIN) {
  return `${String(origin).replace(/\/$/, '')}/api/tesla/callback`;
}

export const CANONICAL_TESLA_REDIRECT_URI = teslaCallbackUrl(CANONICAL_APP_ORIGIN);

function stripTrailingSlash(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function isLocalRedirect(value) {
  return /localhost|127\.0\.0\.1/i.test(String(value || ''));
}

/**
 * Tesla OAuth callback for Vercel / production login.
 * Never uses the request Host or clientOrigin — iPhone and desktop must
 * send Tesla the same registered URI.
 */
export function resolveTeslaRedirectUri({
  teslaRedirectUri = '',
  publicAppUrl = '',
} = {}) {
  const configured = stripTrailingSlash(teslaRedirectUri);
  if (configured && !isLocalRedirect(configured)) {
    return configured;
  }
  return teslaCallbackUrl(stripTrailingSlash(publicAppUrl) || CANONICAL_APP_ORIGIN);
}

export function isKnownAppHost(origin = '') {
  const value = String(origin).toLowerCase();
  return value.includes('roboagent-fleet.vercel.app')
    || value.includes('autofleeto.com');
}
