/** G2 Monument + G6 Ledger — maps to the ROBOAGENT Tesla-slick tokens. */

import { colors, typography } from '../../design/roboagentTokens';

export const monument = {
  canvas: colors.canvas,
  surface: colors.surface,
  ink: colors.ink,
  inkMuted: colors.inkMuted,
  inkGhost: colors.inkSubtle,
  money: colors.ink,
  projected: colors.warning,
  action: colors.primary,
  actionPressed: colors.primaryDark,
  hairline: colors.border,
  ledgerWash: colors.surfaceRaised,
  scrim: colors.scrim,
};

export const monumentType = {
  label: 'text-[11px] font-medium uppercase tracking-[0.28em]',
  navLabel: 'text-[11px] font-medium uppercase tracking-[0.2em]',
  navLabelCompact: 'text-[10px] font-medium uppercase tracking-[0.16em]',
  monument: 'text-[clamp(4.25rem,17vw,6.25rem)] font-medium leading-none tracking-[-0.055em] tabular-nums',
  monumentSm: 'text-[2rem] font-medium leading-none tracking-[-0.04em] tabular-nums',
  subline: 'text-[16px] font-normal tracking-[-0.01em]',
  actionLine: 'text-[15px] font-normal leading-snug',
  actionLink: 'text-[13px] font-medium uppercase tracking-[0.16em]',
  revealHint: 'text-[10px] font-medium uppercase tracking-[0.16em]',
  mono: 'font-mono text-[13px] leading-relaxed tabular-nums',
  monoSm: 'font-mono text-[11px] leading-relaxed tabular-nums',
  ledgerLabel: 'text-[11px] font-medium uppercase tracking-[0.22em]',
  ledgerMono: 'font-mono text-[11px] leading-relaxed tabular-nums',
  ledgerAmount: 'text-[2.15rem] font-medium leading-none tracking-[-0.04em] tabular-nums',
  ledgerHint: 'text-[11px] font-medium',
  sheetTitle: 'text-[22px] font-medium leading-snug tracking-[-0.02em]',
  sheetBody: 'text-[14px] font-normal leading-relaxed',
  buttonPrimary: 'text-[13px] font-semibold uppercase tracking-[0.14em]',
  wordmark: typography.wordmark,
};
