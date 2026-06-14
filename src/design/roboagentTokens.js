/** ROBOAGENT design system — single source of truth for mobile fleet OS surfaces. */

export const colors = {
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  primaryDark: '#1e3a8a',
  canvas: '#f3f4f8',
  surface: '#ffffff',
  ink: '#0f172a',
  inkMuted: '#64748b',
  inkSubtle: '#94a3b8',
  border: 'rgba(15,23,42,0.09)',
  earningsGradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 48%, #7c3aed 100%)',
  success: '#15803d',
  successBg: '#ecfdf3',
  warning: '#a16207',
  warningBg: '#fefce8',
  error: '#dc2626',
  errorBg: '#fef2f2',
  service: '#c2410c',
  serviceBg: '#fff7ed',
  heroDelta: '#bbf7d0',
  heroPulse: '#4ade80',
  navActiveLabel: '#1e3a8a',
};

export const semantic = {
  positive: colors.success,
  positiveBg: colors.successBg,
  surge: colors.primary,
  surgeBg: colors.primaryLight,
  alert: colors.error,
  alertBg: colors.errorBg,
  caution: colors.warning,
  cautionBg: colors.warningBg,
};

export const typography = {
  wordmark: 'text-[1.05rem] font-bold uppercase tracking-[0.04em]',
  wordmarkColor: 'text-[#1e3a8a]',
  screenBadge: 'text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563eb]',
  display: 'text-[4rem] font-bold leading-[0.9] tracking-[-0.045em]',
  pageTitle: 'text-[24px] font-bold tracking-[-0.03em] text-slate-950',
  section: 'text-[18px] font-bold tracking-[-0.02em] text-slate-800',
  sectionSm: 'text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500',
  cardTitle: 'text-[17px] font-bold leading-snug text-slate-950',
  body: 'text-[15px] font-semibold leading-snug text-slate-900',
  bodyMd: 'text-[14px] font-semibold text-slate-900',
  metric: 'text-[38px] font-bold leading-none tabular-nums',
  metricSm: 'text-[24px] font-bold tabular-nums',
  caption: 'text-[11px] font-medium text-slate-400',
  label: 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400',
  navLabel: 'text-[10px] font-semibold leading-tight',
};

export const spacing = {
  page: 'px-4 pt-2 pb-[5.5rem]',
  headerMb: 'mb-4',
  sectionPrimary: 'mt-7',
  sectionSecondary: 'mt-6',
  sectionTertiary: 'mt-5',
  cardPad: 'p-4',
  cardPadLg: 'px-4 py-4',
  stackSm: 'space-y-2.5',
};

export const radius = {
  card: 'rounded-[20px]',
  cardLg: 'rounded-[24px]',
  icon: 'rounded-[14px]',
  pill: 'rounded-full',
};

export const shadow = {
  card: 'shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)]',
  cardSubdued: 'shadow-[0_4px_18px_-16px_rgba(15,23,42,0.22)]',
  hero: 'shadow-[0_24px_56px_-24px_rgba(37,99,235,0.72)]',
  map: 'shadow-[0_20px_48px_-24px_rgba(15,23,42,0.45)]',
  nav: 'shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.18)]',
};

export const card = {
  base: `${radius.card} border border-slate-200/90 bg-white ${shadow.card}`,
  subdued: `${shadow.cardSubdued}`,
  accent: 'border-l-[4px] border-l-blue-600',
};

export const icon = {
  nav: 21,
  navStroke: 2.4,
  navStrokeIdle: 2,
  md: 18,
  lg: 22,
  stroke: 2.2,
  strokeBold: 2.3,
};

export const mobileNavItems = [
  { id: 'overview', label: 'Command', routes: ['overview'] },
  { id: 'dispatch', label: 'Operations', routes: ['dispatch', 'charging', 'health', 'readiness', 'alerts'] },
  { id: 'map', label: 'Map', routes: ['map'] },
  { id: 'network', label: 'Network', routes: ['network'] },
  { id: 'integrations', label: 'Integrations', routes: ['integrations'] },
  { id: 'settings', label: 'Settings', routes: ['settings', 'account'] },
];

/** @deprecated use mobileNavItems — kept for legacy imports */
export const monumentNavItems = mobileNavItems;

export function mobileScreenBadge(route) {
  if (route === 'overview') return null;
  if (route === 'map') return 'Map';
  if (route === 'network') return 'Network';
  if (route === 'integrations') return 'Integrations';
  if (route === 'settings' || route === 'account') return 'Settings';
  if (route === 'fleet' || route === 'vehicle') return 'Fleet';
  if (['dispatch', 'charging', 'health', 'readiness', 'alerts'].includes(route)) return 'Operations';
  return null;
}
