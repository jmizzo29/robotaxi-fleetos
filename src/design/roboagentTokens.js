/** ROBOAGENT design system — Tesla-slick command layer. Single source of truth. */

export const colors = {
  primary: '#5BA8A0',
  primaryLight: 'rgba(91,168,160,0.14)',
  primaryDark: '#3E7D77',
  canvas: '#0E0F12',
  surface: '#16181C',
  surfaceRaised: '#1C1E23',
  ink: '#F3F3F1',
  inkMuted: '#8B8E94',
  inkSubtle: '#5C5F66',
  border: 'rgba(243,243,241,0.08)',
  earningsGradient: 'linear-gradient(180deg, #1A1C20 0%, #0E0F12 100%)',
  success: '#5BA8A0',
  successBg: 'rgba(91,168,160,0.12)',
  warning: '#C4A35A',
  warningBg: 'rgba(196,163,90,0.12)',
  error: '#C45C4A',
  errorBg: 'rgba(196,92,74,0.12)',
  service: '#C4A35A',
  serviceBg: 'rgba(196,163,90,0.12)',
  heroDelta: '#5BA8A0',
  heroPulse: '#5BA8A0',
  navActiveLabel: '#F3F3F1',
  accent: '#5BA8A0',
  accentHover: '#4A8F88',
  scrim: 'rgba(6,7,9,0.72)',
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
  wordmark: 'text-[0.92rem] font-semibold uppercase tracking-[0.28em]',
  wordmarkColor: 'text-[#F3F3F1]',
  screenBadge: 'text-[11px] font-medium uppercase tracking-[0.22em] text-[#8B8E94]',
  display: 'text-[4.5rem] font-medium leading-[0.88] tracking-[-0.05em]',
  pageTitle: 'text-[24px] font-medium tracking-[-0.03em] text-[#F3F3F1]',
  section: 'text-[18px] font-medium tracking-[-0.02em] text-[#E8E8E6]',
  sectionSm: 'text-[12px] font-medium uppercase tracking-[0.18em] text-[#8B8E94]',
  cardTitle: 'text-[17px] font-medium leading-snug text-[#F3F3F1]',
  body: 'text-[15px] font-normal leading-snug text-[#F3F3F1]',
  bodyMd: 'text-[14px] font-normal text-[#F3F3F1]',
  metric: 'text-[38px] font-medium leading-none tabular-nums',
  metricSm: 'text-[24px] font-medium tabular-nums',
  caption: 'text-[11px] font-normal text-[#5C5F66]',
  label: 'text-[11px] font-medium uppercase tracking-[0.18em] text-[#5C5F66]',
  navLabel: 'text-[10px] font-medium uppercase tracking-[0.14em] leading-tight',
};

export const spacing = {
  page: 'px-5 pt-3 pb-[5.5rem]',
  headerMb: 'mb-6',
  sectionPrimary: 'mt-10',
  sectionSecondary: 'mt-8',
  sectionTertiary: 'mt-6',
  cardPad: 'p-4',
  cardPadLg: 'px-4 py-4',
  stackSm: 'space-y-2.5',
};

export const radius = {
  card: 'rounded-[8px]',
  cardLg: 'rounded-[10px]',
  icon: 'rounded-[8px]',
  pill: 'rounded-full',
};

export const shadow = {
  card: 'shadow-none',
  cardSubdued: 'shadow-none',
  hero: 'shadow-none',
  map: 'shadow-none',
  nav: 'shadow-none',
};

export const card = {
  base: `${radius.card} border border-white/[0.08] bg-[#16181C]`,
  subdued: '',
  accent: 'border-l-[2px] border-l-[#5BA8A0]',
};

export const icon = {
  nav: 20,
  navStroke: 1.75,
  navStrokeIdle: 1.5,
  md: 18,
  lg: 22,
  stroke: 1.8,
  strokeBold: 2,
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
