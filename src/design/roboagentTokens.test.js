import { describe, expect, it } from 'vitest';
import { colors, contrastRatio } from './roboagentTokens';

describe('ROBOAGENT contrast tokens', () => {
  it('keeps body, muted, and subtle text readable on graphite surfaces', () => {
    expect(contrastRatio(colors.ink, colors.canvas)).toBeGreaterThanOrEqual(12);
    expect(contrastRatio(colors.inkMuted, colors.surface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.inkSubtle, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.inkMuted, colors.canvas)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.primary, colors.canvas)).toBeGreaterThanOrEqual(7);
  });
});
