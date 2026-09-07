import { describe, expect, it } from 'vitest';
import {
  getNetworkConvoy,
  getNetworkEventRows,
  getNetworkFooterLine,
  getNetworkHero,
} from './networkMonumentUtils';

describe('networkMonumentUtils live events', () => {
  it('renders an honest empty hero when the feed is not configured', () => {
    const convoy = getNetworkConvoy([], {
      configured: false,
      events: [],
      cities: [],
      setupNote: 'Add TICKETMASTER_API_KEY',
    });
    const hero = getNetworkHero(convoy);
    expect(hero.amount).toBe('—');
    expect(hero.subline).toMatch(/not configured/i);
    expect(getNetworkFooterLine(convoy)).not.toMatch(/\$700|Taylor Swift/i);
    expect(getNetworkEventRows({ configured: false, events: [] })[0].event).toMatch(/no event feed configured/i);
  });

  it('shows real event counts without inventing demand scores', () => {
    const live = {
      configured: true,
      source: 'ticketmaster',
      asOf: '2026-09-07T12:00:00.000Z',
      events: [{
        id: 'tm-1',
        title: 'Austin City Limits',
        city: 'Austin',
        startLabel: '2026-09-08',
        venue: 'Zilker Park',
      }],
      cities: [
        { id: 'austin', city: 'Austin', count: 1 },
        { id: 'orlando', city: 'Orlando', count: 0 },
      ],
      disclaimer: 'Public event listings for watch cities — not live robotaxi operations.',
    };
    const convoy = getNetworkConvoy([], live);
    const hero = getNetworkHero(convoy);
    expect(hero.amount).toBe('1');
    expect(hero.subline).toMatch(/ticketmaster/i);
    expect(hero.subline).toMatch(/as of/i);
    expect(convoy.austin).toBe(1);
    expect(JSON.stringify(getNetworkEventRows(live))).not.toMatch(/\+|\$|%/);
  });
});
