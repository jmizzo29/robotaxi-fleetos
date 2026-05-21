const MEMORY_KEY = 'fleetos.memory.v1';
const MAX_EVENTS = 120;

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function normalizeEvent(event) {
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

export function readFleetMemory() {
  if (!canUseStorage()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEMORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFleetMemory(events) {
  if (!canUseStorage()) return [];

  const normalized = events.map(normalizeEvent).slice(0, MAX_EVENTS);
  window.localStorage.setItem(MEMORY_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: normalized }));
  return normalized;
}

export function appendFleetMemory(event) {
  const next = [normalizeEvent(event), ...readFleetMemory()].slice(0, MAX_EVENTS);
  return writeFleetMemory(next);
}

export function clearFleetMemory() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(MEMORY_KEY);
  window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: [] }));
}

export function exportFleetMemory() {
  return JSON.stringify(readFleetMemory(), null, 2);
}
