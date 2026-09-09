/** ROBOAGENT design system — Tesla-slick command layer. Single source of truth. */

export const colors = {
  primary: '#5ED4C8',
  primaryLight: 'rgba(94,212,200,0.18)',
  primaryDark: '#3E9E94',
  canvas: '#08090B',
  surface: '#121316',
  surfaceRaised: '#1A1B20',
  ink: '#F7F7F5',
  inkMuted: '#C6C8CE',
  inkSubtle: '#A8ABB3',
  navIdle: '#D4D6DA',
  border: 'rgba(94,212,200,0.30)',
  earningsGradient: 'linear-gradient(180deg, #1C1E24 0%, #0C0D10 100%)',
  canvasWash: 'radial-gradient(ellipse 92% 58% at 50% -12%, rgba(94,212,200,0.18), transparent 62%)',
  success: '#5ED4C8',
  successBg: 'rgba(94,212,200,0.16)',
  warning: '#E0B45C',
  warningBg: 'rgba(224,180,92,0.16)',
  error: '#E06A56',
  errorBg: 'rgba(224,106,86,0.16)',
  service: '#E0B45C',
  serviceBg: 'rgba(224,180,92,0.16)',
  heroDelta: '#5ED4C8',
  heroPulse: '#5ED4C8',
  navActiveLabel: '#F7F7F5',
  accent: '#5ED4C8',
  accentHover: '#4BBBB0',
  scrim: 'rgba(4,5,7,0.78)',
  cardGlow: [
    '0 0 0 1px rgba(94,212,200,0.22)',
    '0 18px 44px rgba(0,0,0,0.55)',
    'inset 0 1px 0 rgba(247,247,245,0.07)',
  ].join(', '),
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
  wordmarkColor: 'text-[#F7F7F5]',
  screenBadge: 'text-[11px] font-medium uppercase tracking-[0.22em] text-[#C6C8CE]',
  display: 'text-[4.5rem] font-semibold leading-[0.88] tracking-[-0.05em]',
  pageTitle: 'text-[24px] font-semibold tracking-[-0.03em] text-[#F7F7F5]',
  section: 'text-[18px] font-semibold tracking-[-0.02em] text-[#F0F0EE]',
  sectionSm: 'text-[12px] font-medium uppercase tracking-[0.18em] text-[#C6C8CE]',
  cardTitle: 'text-[17px] font-semibold leading-snug text-[#F7F7F5]',
  body: 'text-[15px] font-normal leading-snug text-[#F7F7F5]',
  bodyMd: 'text-[14px] font-normal text-[#F0F0EE]',
  metric: 'text-[38px] font-semibold leading-none tabular-nums',
  metricSm: 'text-[24px] font-semibold tabular-nums',
  caption: 'text-[11px] font-normal text-[#A8ABB3]',
  label: 'text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8ABB3]',
  navLabel: 'text-[10px] font-medium uppercase tracking-[0.14em] leading-tight',
  muted: 'text-[#C6C8CE]',
  subtle: 'text-[#A8ABB3]',
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
  card: 'rounded-[12px]',
  cardLg: 'rounded-[14px]',
  icon: 'rounded-[10px]',
  pill: 'rounded-full',
};

export const shadow = {
  card: 'shadow-[0_18px_44px_rgba(0,0,0,0.55)]',
  cardSubdued: 'shadow-[0_10px_28px_rgba(0,0,0,0.4)]',
  hero: 'shadow-[0_0_48px_rgba(94,212,200,0.12)]',
  map: 'shadow-[0_18px_44px_rgba(0,0,0,0.55)]',
  nav: 'shadow-[0_12px_36px_rgba(0,0,0,0.5)]',
};

export const card = {
  base: `${radius.card} border border-[rgba(94,212,200,0.28)] bg-[#121316] shadow-[0_18px_44px_rgba(0,0,0,0.45)]`,
  subdued: '',
  accent: 'border-l-[2px] border-l-[#5ED4C8]',
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

function hexToRgb(hex) {
  const raw = hex.replace('#', '');
  const value = raw.length === 3 ? raw.split('').map((ch) => ch + ch).join('') : raw;
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

function channel(value) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
