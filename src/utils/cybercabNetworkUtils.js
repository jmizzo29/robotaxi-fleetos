import { cybercabMarkets, recommendedExpansion } from '../data/cybercabNetwork';

export function getCybercabNetworkSummary(markets = cybercabMarkets) {
  const live = markets.filter((market) => market.phase === 'live').length;
  const preview = markets.filter((market) => market.phase === 'preview').length;
  const planned = markets.filter((market) => market.phase === 'planned').length;
  const early = markets.filter((market) => market.phase === 'early').length;

  return {
    live,
    preview,
    planned,
    early,
    recommendedExpansion,
    total: markets.length,
    verifiedLive: live,
  };
}

export function getPhaseLabel(phase) {
  if (phase === 'live') return 'Live';
  if (phase === 'preview') return 'Preview';
  if (phase === 'early') return 'Preview';
  return 'Planned';
}

export function getPhaseTextClass(phase) {
  if (phase === 'live') return 'text-emerald-400';
  if (phase === 'preview' || phase === 'early') return 'text-amber-300';
  return 'text-blue-400';
}

export function getPhaseMarkerClass(phase) {
  if (phase === 'live') return 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.65)]';
  if (phase === 'preview' || phase === 'early') return 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.55)]';
  return 'bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.55)]';
}

export function getPhaseRingClass(phase) {
  if (phase === 'live') return 'ring-emerald-300/40';
  if (phase === 'preview' || phase === 'early') return 'ring-amber-300/40';
  return 'ring-blue-300/40';
}
