import { getCybercabNetworkSummary } from './cybercabNetworkUtils';
import { getExpansionRecommendation } from './networkIntelligenceUtils';

function asOfLabel(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function getNetworkConvoy(fleet = [], live = null) {
  const summary = getCybercabNetworkSummary();
  const events = Array.isArray(live?.events) ? live.events : [];
  const cities = Array.isArray(live?.cities) ? live.cities : [];
  const topCity = cities.slice().sort((a, b) => b.count - a.count)[0];

  return {
    markets: summary.preview + summary.planned + summary.early,
    orlando: cities.find((entry) => entry.id === 'orlando')?.count ?? 0,
    tampa: cities.find((entry) => entry.id === 'tampa')?.count ?? 0,
    austin: cities.find((entry) => entry.id === 'austin')?.count ?? 0,
    events: events.length,
    city: topCity?.city || 'Watch cities',
    topEvent: events[0] || null,
    expansion: getExpansionRecommendation(fleet),
    verifiedLive: summary.live,
    empty: events.length === 0,
    configured: Boolean(live?.configured),
    loading: Boolean(live?.loading),
    source: live?.source || null,
    asOf: live?.asOf || null,
    asOfLabel: asOfLabel(live?.asOf),
    setupNote: live?.setupNote || null,
    disclaimer: live?.disclaimer || 'Public event listings — not live robotaxi operations.',
    error: live?.error || null,
    cities,
    eventList: events,
  };
}

export function getNetworkHero(convoy) {
  if (convoy.loading) {
    return {
      label: 'NETWORK',
      amount: '—',
      subline: 'Loading public events…',
    };
  }
  if (!convoy.configured) {
    return {
      label: 'NETWORK',
      amount: '—',
      subline: 'event feed not configured',
    };
  }
  return {
    label: 'NETWORK',
    amount: convoy.empty ? '—' : String(convoy.events),
    subline: [
      convoy.source,
      convoy.asOfLabel ? `as of ${convoy.asOfLabel}` : null,
      'public listings',
    ].filter(Boolean).join(' · '),
  };
}

export function getNetworkEventRows(live = null, limit = 8) {
  const events = Array.isArray(live?.events) ? live.events.slice(0, limit) : [];
  if (!events.length) {
    return [{
      cab: 'Network',
      event: live?.configured
        ? 'No upcoming public events in tracked cities'
        : 'No event feed configured',
      value: '—',
      tone: 'neutral',
    }];
  }
  return events.map((event) => ({
    cab: event.city,
    event: event.title,
    value: event.startLabel || '—',
    tone: 'neutral',
  }));
}

export function getNetworkFooterLine(convoy) {
  if (convoy.loading) return 'Loading public events for watch cities…';
  if (!convoy.configured) {
    return 'Public events stay empty until a server key is set. No invented concerts or demand scores.';
  }
  if (convoy.empty) {
    return `${convoy.disclaimer} ${convoy.error || ''}`.trim();
  }
  const event = convoy.topEvent;
  return `${event.title} — ${event.city}. ${convoy.disclaimer}`;
}
