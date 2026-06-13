import { describe, it, expect } from 'vitest';
import { getCybercabNetworkSummary, getPhaseLabel } from './cybercabNetworkUtils';
import { cybercabMarkets } from '../data/cybercabNetwork';

describe('getCybercabNetworkSummary', () => {
  it('counts live and planned markets from the local dataset', () => {
    const summary = getCybercabNetworkSummary(cybercabMarkets);
    expect(summary.live).toBe(3);
    expect(summary.planned).toBe(5);
    expect(summary.recommendedExpansion).toBe('Orlando');
  });
});

describe('getPhaseLabel', () => {
  it('maps rollout phases to readable labels', () => {
    expect(getPhaseLabel('live')).toBe('Live');
    expect(getPhaseLabel('planned')).toBe('Planned');
    expect(getPhaseLabel('early')).toBe('Early Rollout');
  });
});
