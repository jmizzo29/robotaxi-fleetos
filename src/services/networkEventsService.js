import { fetchApiJson } from './apiClient';

export function emptyNetworkEventsState() {
  return {
    configured: false,
    provider: null,
    source: null,
    asOf: null,
    disclaimer: 'Public event listings for watch cities — not live robotaxi operations or owner demand scores.',
    setupNote: 'Add TICKETMASTER_API_KEY or PREDICTHQ_TOKEN on the server.',
    error: null,
    events: [],
    cities: [],
    cached: false,
  };
}

export async function fetchNetworkEvents() {
  return fetchApiJson('/network/events');
}
