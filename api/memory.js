import { getDefaultFleetForSession } from './_lib/auth.js';
import { ensureFleetSchema, hasPostgres, query } from './_lib/db.js';

const MAX_EVENTS = 120;

function normalizeEvent(event = {}) {
  return {
    id: event.id || `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || 'Event',
    title: event.title || 'ROBOAGENT event',
    detail: event.detail || '',
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || 'fleetos',
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

async function listMemoryEvents(fleetId) {
  await ensureFleetSchema();
  const { rows } = await query(`
    select id, type, title, detail, event_timestamp, source, status, rag_ready, metadata
    from fleetos_memory_events
    where fleet_id = $2
    order by event_timestamp desc
    limit $1
  `, [MAX_EVENTS, fleetId]);
  return rows.map(rowToEvent);
}

async function saveMemoryEvents(fleetId, events) {
  const normalized = events.map(normalizeEvent);
  await ensureFleetSchema();
  await Promise.all(normalized.map((event) => query(
    `insert into fleetos_memory_events (id, fleet_id, type, title, detail, event_timestamp, source, status, rag_ready, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     on conflict (id) do update set
       fleet_id = excluded.fleet_id,
       type = excluded.type,
       title = excluded.title,
       detail = excluded.detail,
       event_timestamp = excluded.event_timestamp,
       source = excluded.source,
       status = excluded.status,
       rag_ready = excluded.rag_ready,
       metadata = excluded.metadata`,
    [event.id, fleetId, event.type, event.title, event.detail, event.timestamp, event.source, event.status, event.ragReady, JSON.stringify(event.metadata || {})],
  )));
  return listMemoryEvents(fleetId);
}

async function clearMemoryEvents(fleetId) {
  await ensureFleetSchema();
  await query('delete from fleetos_memory_events where fleet_id = $1', [fleetId]);
  return [];
}

export default async function handler(req, res) {
  if (!hasPostgres()) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres DATABASE_URL is required for fleet memory.',
    });
    return;
  }

  if (req.method === 'GET') {
    const context = await getDefaultFleetForSession(req, res);
    res.status(200).json({ events: await listMemoryEvents(context.fleet.id), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'POST') {
    const context = await getDefaultFleetForSession(req, res);
    const incoming = Array.isArray(req.body?.events)
      ? req.body.events
      : req.body?.event
        ? [req.body.event]
        : [];

    res.status(200).json({ events: await saveMemoryEvents(context.fleet.id, incoming), postgres: hasPostgres() });
    return;
  }

  if (req.method === 'DELETE') {
    const context = await getDefaultFleetForSession(req, res);
    res.status(200).json({ events: await clearMemoryEvents(context.fleet.id), postgres: hasPostgres() });
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
