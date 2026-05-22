import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

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

function rowToEvent(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail || '',
    timestamp: row.event_timestamp,
    source: row.source,
    status: row.status,
    ragReady: Boolean(row.rag_ready),
    metadata: row.metadata || {},
  };
}

async function listMemoryEvents() {
  if (!hasPostgres()) return globalThis.__fleetosMemoryEvents;
  await ensureFleetSchema();
  const { rows } = await query(`
    select id, type, title, detail, event_timestamp, source, status, rag_ready, metadata
    from fleetos_memory_events
    order by event_timestamp desc
    limit $1
  `, [MAX_EVENTS]);
  return rows.map(rowToEvent);
}

async function saveMemoryEvents(events) {
  const normalized = events.map(normalizeEvent);
  if (!hasPostgres()) {
    globalThis.__fleetosMemoryEvents = [
      ...normalized,
      ...globalThis.__fleetosMemoryEvents,
    ].slice(0, MAX_EVENTS);
    return globalThis.__fleetosMemoryEvents;
  }

  await ensureFleetSchema();
  await Promise.all(normalized.map((event) => query(
    `insert into fleetos_memory_events (id, type, title, detail, event_timestamp, source, status, rag_ready, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set
       type = excluded.type,
       title = excluded.title,
       detail = excluded.detail,
       event_timestamp = excluded.event_timestamp,
       source = excluded.source,
       status = excluded.status,
       rag_ready = excluded.rag_ready,
       metadata = excluded.metadata`,
    [event.id, event.type, event.title, event.detail, event.timestamp, event.source, event.status, event.ragReady, JSON.stringify(event.metadata || {})],
  )));
  return listMemoryEvents();
}

async function clearMemoryEvents() {
  if (!hasPostgres()) {
    globalThis.__fleetosMemoryEvents = [];
    return [];
  }
  await ensureFleetSchema();
  await query('delete from fleetos_memory_events');
  return [];
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ events: await listMemoryEvents(), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'POST') {
    const incoming = Array.isArray(req.body?.events)
      ? req.body.events
      : req.body?.event
        ? [req.body.event]
        : [];

    res.status(200).json({ events: await saveMemoryEvents(incoming), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'DELETE') {
    res.status(200).json({ events: await clearMemoryEvents(), postgres: hasPostgres() });
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
