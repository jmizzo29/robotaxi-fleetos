import { getApiBase } from './apiClient';

const MEMORY_KEY = 'fleetos.memory.v1';
const MAX_EVENTS = 120;

const API_BASE = getApiBase();

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
  const normalized = normalizeEvent(event);
  const next = [normalized, ...readFleetMemory()].slice(0, MAX_EVENTS);
  fetch(`${API_BASE}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: normalized }),
  }).catch(() => {});
  return writeFleetMemory(next);
}

export function clearFleetMemory() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(MEMORY_KEY);
  fetch(`${API_BASE}/memory`, { method: 'DELETE' }).catch(() => {});
  window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: [] }));
}

export function exportFleetMemory() {
  return JSON.stringify(readFleetMemory(), null, 2);
}

export async function syncFleetMemoryFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/memory`, { cache: 'no-store' });
    if (!response.ok) return readFleetMemory();

    const data = await response.json();
    if (!Array.isArray(data.events)) return readFleetMemory();

    const merged = [...data.events, ...readFleetMemory()]
      .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
      .slice(0, MAX_EVENTS);

    return writeFleetMemory(merged);
  } catch {
    return readFleetMemory();
  }
}
