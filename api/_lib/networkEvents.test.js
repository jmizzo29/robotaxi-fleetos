import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildEmptyNetworkEventsPayload,
  getNetworkEvents,
  NETWORK_EVENT_CACHE_TTL_MS,
  normalizePredictHqEvent,
  normalizeTicketmasterEvent,
  resetNetworkEventsCache,
  resolveNetworkEventsProvider,
} from './networkEvents.js';

const austin = { id: 'austin', city: 'Austin', latitude: 30.2672, longitude: -97.7431 };

afterEach(() => {
  resetNetworkEventsCache();
});

describe('resolveNetworkEventsProvider', () => {
  it('prefers Ticketmaster when both keys exist', () => {
    expect(resolveNetworkEventsProvider({
      TICKETMASTER_API_KEY: 'tm',
      PREDICTHQ_TOKEN: 'phq',
    })).toBe('ticketmaster');
  });

  it('falls back to PredictHQ', () => {
    expect(resolveNetworkEventsProvider({ PREDICTHQ_TOKEN: 'phq' })).toBe('predicthq');
  });

  it('returns null when no key is configured', () => {
    expect(resolveNetworkEventsProvider({})).toBeNull();
  });
});

describe('getNetworkEvents', () => {
  it('fails closed with an empty payload when no API key is set', async () => {
    const fetchImpl = vi.fn();
    const payload = await getNetworkEvents({ env: {}, fetchImpl, now: Date.parse('2026-09-07T12:00:00Z') });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(payload.configured).toBe(false);
    expect(payload.events).toEqual([]);
    expect(payload.setupNote).toMatch(/TICKETMASTER_API_KEY/);
    expect(payload.disclaimer).toMatch(/not live robotaxi operations/i);
    expect(payload.error).toBeNull();
  });

  it('returns normalized Ticketmaster events and caches the result', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        _embedded: {
          events: [{
            id: 'evt-1',
            name: 'Austin City Limits',
            url: 'https://ticketmaster.example/acl',
            dates: { start: { dateTime: '2026-09-08T19:00:00Z', localDate: '2026-09-08', localTime: '14:00:00' } },
            classifications: [{ segment: { name: 'Music' } }],
            _embedded: { venues: [{ name: 'Zilker Park', city: { name: 'Austin' } }] },
          }],
        },
      }),
    }));

    const first = await getNetworkEvents({
      env: { TICKETMASTER_API_KEY: 'tm-test' },
      fetchImpl,
      now: Date.parse('2026-09-07T12:00:00Z'),
    });
    expect(first.configured).toBe(true);
    expect(first.source).toBe('ticketmaster');
    expect(first.events[0].title).toBe('Austin City Limits');
    expect(first.events[0].city).toBe('Austin');
    expect(first.events[0].venue).toBe('Zilker Park');
    expect(first.cached).toBe(false);
    expect(first.disclaimer).not.toMatch(/\$700|Taylor Swift/i);

    const second = await getNetworkEvents({
      env: { TICKETMASTER_API_KEY: 'tm-test' },
      fetchImpl,
      now: Date.parse('2026-09-07T13:00:00Z'),
    });
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(first.cities.length);
    expect(NETWORK_EVENT_CACHE_TTL_MS).toBeGreaterThanOrEqual(6 * 60 * 60 * 1000);
  });

  it('does not invent events when the provider returns none', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [] }),
    }));
    const payload = await getNetworkEvents({
      env: { PREDICTHQ_TOKEN: 'phq-test' },
      fetchImpl,
      now: Date.parse('2026-09-07T12:00:00Z'),
    });
    expect(payload.events).toEqual([]);
    expect(payload.configured).toBe(true);
    expect(payload.error).toMatch(/no upcoming events/i);
  });
});

describe('normalizers', () => {
  it('maps Ticketmaster and PredictHQ records without invented money', () => {
    const tm = normalizeTicketmasterEvent({
      id: '1',
      name: 'Race Weekend',
      dates: { start: { localDate: '2026-09-09' } },
      _embedded: { venues: [{ name: 'Circuit', city: { name: 'Austin' } }] },
    }, austin);
    expect(tm.demandLabel).toBeUndefined();
    expect(JSON.stringify(tm)).not.toMatch(/\$\d|%/);

    const phq = normalizePredictHqEvent({
      id: '2',
      title: 'Festival',
      start: '2026-09-10T01:00:00Z',
      category: 'festivals',
    }, austin);
    expect(phq.city).toBe('Austin');
    expect(phq.source).toBe('predicthq');
  });

  it('builds a labeled empty payload', () => {
    const empty = buildEmptyNetworkEventsPayload({ now: Date.parse('2026-09-07T00:00:00Z') });
    expect(empty.events).toEqual([]);
    expect(empty.cities).toHaveLength(9);
    expect(empty.setupNote).toMatch(/TICKETMASTER_API_KEY/);
  });
});
