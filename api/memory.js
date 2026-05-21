const MAX_EVENTS = 120;
globalThis.__fleetosMemoryEvents = globalThis.__fleetosMemoryEvents || [];

function normalizeEvent(event = {}) {
  return {
    id: event.id || `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || 'Event',
    title: event.title || 'FleetOS event',
    detail: event.detail || '',
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || 'FleetOS',
    status: event.status || 'recorded',
    ragReady: Boolean(event.ragReady),
    metadata: event.metadata || {},
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ events: globalThis.__fleetosMemoryEvents });
    return;
  }

  if (req.method === 'POST') {
    const incoming = Array.isArray(req.body?.events)
      ? req.body.events
      : req.body?.event
        ? [req.body.event]
        : [];

    globalThis.__fleetosMemoryEvents = [
      ...incoming.map(normalizeEvent),
      ...globalThis.__fleetosMemoryEvents,
    ].slice(0, MAX_EVENTS);

    res.status(200).json({ events: globalThis.__fleetosMemoryEvents });
    return;
  }

  if (req.method === 'DELETE') {
    globalThis.__fleetosMemoryEvents = [];
    res.status(200).json({ events: [] });
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
