export const CHARGING_SCOPE = 'vehicle_charging_cmds';

export const DEFAULT_USER_SCOPES = [
  'openid',
  'offline_access',
  'user_data',
  'vehicle_device_data',
  'vehicle_location',
  CHARGING_SCOPE,
].join(' ');

export const MISSING_CHARGING_SCOPE_MESSAGE = 'Charging history needs Tesla charging permission. Connect Tesla again to grant it. The app is not broken.';

export function parseScopeList(raw) {
  if (Array.isArray(raw)) return raw.map((item) => String(item || '').trim()).filter(Boolean);
  if (!raw) return [];
  return String(raw).split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

export function decodeJwtPayload(token) {
  try {
    const part = String(token || '').split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function scopesFromTokenAndRecord({ accessToken, storedScope } = {}) {
  const claims = decodeJwtPayload(accessToken);
  const fromJwt = parseScopeList(claims?.scp || claims?.scope);
  const fromStore = parseScopeList(storedScope);
  return [...new Set([...fromJwt, ...fromStore])];
}

export function hasChargingCmds(scopes = []) {
  return parseScopeList(scopes).includes(CHARGING_SCOPE);
}

export function isMissingChargingScopeError(error) {
  const text = `${error?.message || ''} ${error?.code || ''} ${JSON.stringify(error?.body || {})}`.toLowerCase();
  return (
    text.includes('vehicle_charging_cmds')
    || text.includes('missing scope')
    || text.includes('missing_scopes')
    || text.includes('insufficient_scope')
    || (Number(error?.status) === 403 && text.includes('scope'))
  );
}
