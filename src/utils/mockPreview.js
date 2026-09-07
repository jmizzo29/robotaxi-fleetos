/** Explicit `?mock` preview only — never inferred from auth or Tesla state. */
export function isMockPreviewEnabled(search = '') {
  const raw = search || (typeof window !== 'undefined' ? window.location.search : '');
  return new URLSearchParams(raw).has('mock');
}
