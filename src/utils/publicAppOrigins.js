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

export function isKnownAppHost(origin = '') {
  const value = String(origin).toLowerCase();
  return value.includes('roboagent-fleet.vercel.app')
    || value.includes('autofleeto.com');
}
