import {
  getExpansionRecommendation,
  getExpansionScoreboard,
  getNetworkOpportunities,
} from './networkIntelligenceUtils';

export function getNetworkConvoy(fleet = []) {
  const scoreboard = getExpansionScoreboard();
  const events = getNetworkOpportunities(fleet);
  const orlando = scoreboard.find((entry) => entry.city === 'Orlando') || scoreboard[0];
  const tampa = scoreboard.find((entry) => entry.city === 'Tampa') || scoreboard[1];

  return {
    markets: 3,
    orlando: orlando?.score ?? 92,
    tampa: tampa?.score ?? 88,
    events: Math.min(events.length, 5),
    city: 'Florida',
    topEvent: events[0],
    expansion: getExpansionRecommendation(fleet),
  };
}

export function getNetworkHero(convoy) {
  return {
    label: 'NETWORK',
    amount: String(convoy.markets),
    subline: `active markets · ${convoy.city}`,
  };
}

export function getNetworkEventRows(fleet = [], limit = 3) {
  return getNetworkOpportunities(fleet).slice(0, limit).map((event) => ({
    cab: event.place,
    event: event.title,
    value: event.demandLabel,
    tone: event.tone === 'primary' ? 'positive' : event.tone === 'warning' ? 'alert' : 'positive',
  }));
}

export function getNetworkFooterLine(convoy) {
  const event = convoy.topEvent;
  if (!event) return 'Review Florida expansion opportunities.';
  return `${event.title} ${event.demandLabel} ${event.place}.`;
}
