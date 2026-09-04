import { getCybercabNetworkSummary } from './cybercabNetworkUtils';
import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from './networkIntelligenceUtils';

export function getNetworkConvoy(fleet = []) {
  const summary = getCybercabNetworkSummary();
  const scoreboard = getExpansionScoreboard();
  const events = getNetworkOpportunities(fleet);
  const orlando = scoreboard.find((entry) => entry.city === 'Orlando');
  const tampa = scoreboard.find((entry) => entry.city === 'Tampa');

  return {
    markets: summary.preview + summary.planned + summary.early,
    orlando: orlando?.score ?? '—',
    tampa: tampa?.score ?? '—',
    events: events.length,
    city: 'Preview',
    topEvent: events[0] || null,
    expansion: getExpansionRecommendation(fleet),
    verifiedLive: summary.live,
    empty: events.length === 0 && scoreboard.length === 0,
  };
}

export function getNetworkHero(convoy) {
  return {
    label: 'NETWORK',
    amount: convoy.empty ? '—' : String(convoy.markets),
    subline: convoy.verifiedLive > 0
      ? `verified live markets · ${convoy.city}`
      : 'preview markets · not verified live operations',
  };
}

export function getNetworkEventRows(fleet = [], limit = 3) {
  const events = getNetworkOpportunities(fleet).slice(0, limit);
  if (!events.length) {
    return [{
      cab: 'Preview',
      event: 'No live demand events for this fleet',
      value: '—',
      tone: 'neutral',
    }];
  }
  return events.map((event) => ({
    cab: event.place,
    event: event.title,
    value: event.demandLabel,
    tone: event.tone === 'primary' ? 'positive' : event.tone === 'warning' ? 'alert' : 'positive',
  }));
}

export function getNetworkFooterLine(convoy) {
  if (convoy.empty || !convoy.topEvent) {
    return 'Network scores and events are preview only — not live owner intelligence.';
  }
  const event = convoy.topEvent;
  return `${event.title} ${event.demandLabel} ${event.place}.`;
}
