import { describe, it, expect } from 'vitest';
import { getCybercabNetworkSummary, getPhaseLabel } from './cybercabNetworkUtils';
import { cybercabMarkets } from '../data/cybercabNetwork';

describe('getCybercabNetworkSummary', () => {
  it('does not claim unverified markets as live Tesla Robotaxi operations', () => {
    const summary = getCybercabNetworkSummary(cybercabMarkets);
    expect(summary.live).toBe(0);
    expect(summary.verifiedLive).toBe(0);
    expect(summary.preview).toBeGreaterThan(0);
    expect(summary.planned).toBeGreaterThan(0);
    expect(summary.recommendedExpansion).toBe('Orlando');
    expect(cybercabMarkets.every((market) => market.phase !== 'live')).toBe(true);
    expect(cybercabMarkets.some((market) => /not confirmed|watch market|illustrative/i.test(market.notes))).toBe(true);
  });
});

describe('getPhaseLabel', () => {
  it('maps rollout phases to readable labels', () => {
    expect(getPhaseLabel('live')).toBe('Live');
    expect(getPhaseLabel('preview')).toBe('Preview');
    expect(getPhaseLabel('planned')).toBe('Planned');
    expect(getPhaseLabel('early')).toBe('Preview');
  });
});
