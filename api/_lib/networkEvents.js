/** Tracked robotaxi/network watch cities — public events only, not live Tesla operations. */
export const NETWORK_CITIES = [
  { id: 'austin', city: 'Austin', queryCity: 'Austin', latitude: 30.2672, longitude: -97.7431 },
  { id: 'las-vegas', city: 'Las Vegas', queryCity: 'Las Vegas', latitude: 36.1699, longitude: -115.1398 },
  { id: 'sf-bay-area', city: 'SF Bay Area', queryCity: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
  { id: 'orlando', city: 'Orlando', queryCity: 'Orlando', latitude: 28.5383, longitude: -81.3792 },
  { id: 'dallas', city: 'Dallas', queryCity: 'Dallas', latitude: 32.7767, longitude: -96.797 },
  { id: 'houston', city: 'Houston', queryCity: 'Houston', latitude: 29.7604, longitude: -95.3698 },
  { id: 'phoenix', city: 'Phoenix', queryCity: 'Phoenix', latitude: 33.4484, longitude: -112.074 },
  { id: 'miami', city: 'Miami', queryCity: 'Miami', latitude: 25.7617, longitude: -80.1918 },
  { id: 'tampa', city: 'Tampa', queryCity: 'Tampa', latitude: 27.9506, longitude: -82.4572 },
];

export const NETWORK_EVENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const NETWORK_EVENT_WINDOW_DAYS = 7;

const SETUP_NOTE = 'Add TICKETMASTER_API_KEY (preferred) or PREDICTHQ_TOKEN on the server. Keys stay server-side.';

let cache = {
  key: '',
  expiresAt: 0,
  payload: null,
};

export function resetNetworkEventsCache() {
  cache = { key: '', expiresAt: 0, payload: null };
}

export function resolveNetworkEventsProvider(env = process.env) {
  if (String(env.TICKETMASTER_API_KEY || '').trim()) return 'ticketmaster';
  if (String(env.PREDICTHQ_TOKEN || '').trim()) return 'predicthq';
  return null;
}

function isoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function windowRange(now = Date.now(), days = NETWORK_EVENT_WINDOW_DAYS) {
  const start = new Date(now);
  const end = new Date(now + days * 86400000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: isoDateOnly(start),
    endDate: isoDateOnly(end),
  };
}

function formatWhen(iso, localDate, localTime) {
  if (localDate) {
    const time = localTime ? ` · ${localTime.slice(0, 5)}` : '';
    return `${localDate}${time}`;
  }
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso).slice(0, 10);
  return date.toISOString().replace('T', ' · ').slice(0, 18);
}

export function normalizeTicketmasterEvent(raw, market) {
  const venue = raw?._embedded?.venues?.[0];
  const start = raw?.dates?.start || {};
  const startAt = start.dateTime || (start.localDate ? `${start.localDate}T${start.localTime || '00:00:00'}` : '');
  const city = venue?.city?.name || market.city;
  return {
    id: `tm-${raw.id}`,
    title: raw.name || 'Untitled event',
    city,
    marketId: market.id,
    venue: venue?.name || city,
    startAt,
    startLabel: formatWhen(start.dateTime, start.localDate, start.localTime),
    category: raw.classifications?.[0]?.segment?.name || raw.classifications?.[0]?.genre?.name || 'Event',
    url: raw.url || null,
    source: 'ticketmaster',
  };
}

export function normalizePredictHqEvent(raw, market) {
  const venue = (raw.entities || []).find((entity) => entity.type === 'venue')?.name;
  const startAt = raw.start || raw.start_local || '';
  return {
    id: `phq-${raw.id}`,
    title: raw.title || 'Untitled event',
    city: market.city,
    marketId: market.id,
    venue: venue || market.city,
    startAt,
    startLabel: formatWhen(startAt),
    category: raw.category || 'Event',
    url: null,
    source: 'predicthq',
  };
}

export function buildEmptyNetworkEventsPayload({
  configured = false,
  provider = null,
  error = null,
  now = Date.now(),
} = {}) {
  return {
    configured,
    provider,
    source: configured ? provider : null,
    asOf: new Date(now).toISOString(),
    disclaimer: 'Public event listings for watch cities — not live robotaxi operations or owner demand scores.',
    setupNote: configured ? null : SETUP_NOTE,
    error,
    events: [],
    cities: NETWORK_CITIES.map((market) => ({
      id: market.id,
      city: market.city,
      count: 0,
    })),
  };
}

function decorateEvents(events, now = Date.now()) {
  const cities = NETWORK_CITIES.map((market) => ({
    id: market.id,
    city: market.city,
    count: events.filter((event) => event.marketId === market.id).length,
  }));
  return {
    cities,
    events: events
      .slice()
      .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)))
      .slice(0, 40),
    asOf: new Date(now).toISOString(),
    disclaimer: 'Public event listings for watch cities — not live robotaxi operations or owner demand scores.',
  };
}

async function fetchTicketmasterCity(market, range, apiKey, fetchImpl) {
  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('latlong', `${market.latitude},${market.longitude}`);
  url.searchParams.set('radius', '30');
  url.searchParams.set('unit', 'miles');
  url.searchParams.set('startDateTime', range.startIso.replace(/\.\d{3}Z$/, 'Z'));
  url.searchParams.set('endDateTime', range.endIso.replace(/\.\d{3}Z$/, 'Z'));
  url.searchParams.set('size', '8');
  url.searchParams.set('sort', 'date,asc');
  url.searchParams.set('classificationName', 'Music,Sports,Arts & Theatre,Miscellaneous');

  const response = await fetchImpl(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Ticketmaster ${response.status} for ${market.city}`);
  }
  const data = await response.json();
  return (data._embedded?.events || []).map((event) => normalizeTicketmasterEvent(event, market));
}

async function fetchPredictHqCity(market, range, token, fetchImpl) {
  const url = new URL('https://api.predicthq.com/v1/events/');
  url.searchParams.set('within', `30km@${market.latitude},${market.longitude}`);
  url.searchParams.set('active.gte', range.startDate);
  url.searchParams.set('active.lte', range.endDate);
  url.searchParams.set('category', 'concerts,sports,expos,conferences,festivals,performing-arts');
  url.searchParams.set('limit', '8');
  url.searchParams.set('sort', 'start');

  const response = await fetchImpl(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`PredictHQ ${response.status} for ${market.city}`);
  }
  const data = await response.json();
  return (data.results || []).map((event) => normalizePredictHqEvent(event, market));
}

export async function getNetworkEvents({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now(),
  force = false,
} = {}) {
  const provider = resolveNetworkEventsProvider(env);
  const cacheKey = `${provider || 'none'}:${isoDateOnly(new Date(now))}`;

  if (!force && cache.payload && cache.key === cacheKey && cache.expiresAt > now) {
    return { ...cache.payload, cached: true };
  }

  if (!provider) {
    const payload = {
      ...buildEmptyNetworkEventsPayload({ configured: false, now }),
      cached: false,
    };
    cache = { key: cacheKey, expiresAt: now + NETWORK_EVENT_CACHE_TTL_MS, payload };
    return payload;
  }

  const range = windowRange(now);
  const errors = [];
  const events = [];

  try {
    if (provider === 'ticketmaster') {
      const apiKey = String(env.TICKETMASTER_API_KEY).trim();
      for (const market of NETWORK_CITIES) {
        try {
          events.push(...await fetchTicketmasterCity(market, range, apiKey, fetchImpl));
        } catch (error) {
          errors.push(error.message);
        }
      }
    } else {
      const token = String(env.PREDICTHQ_TOKEN).trim();
      for (const market of NETWORK_CITIES) {
        try {
          events.push(...await fetchPredictHqCity(market, range, token, fetchImpl));
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  const decorated = decorateEvents(events, now);
  const payload = {
    configured: true,
    provider,
    source: provider,
    setupNote: null,
    error: events.length ? null : (errors[0] || 'No upcoming events returned.'),
    cached: false,
    ...decorated,
  };

  cache = { key: cacheKey, expiresAt: now + NETWORK_EVENT_CACHE_TTL_MS, payload };
  return payload;
}
