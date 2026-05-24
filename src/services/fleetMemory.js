import { getApiBase } from './apiClient';

const MAX_EVENTS = 120;

const API_BASE = getApiBase();
let memoryCache = [];

function normalizeEvent(event) {
  return {
    id: event.id || `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type || 'Event',
    title: event.title || 'RoboAgent event',
    detail: event.detail || '',
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || 'fleetos',
    status: event.status || 'recorded',
    ragReady: Boolean(event.ragReady),
    metadata: event.metadata || {},
  };
}

export function readFleetMemory() {
  return memoryCache;
}

export function writeFleetMemory(events) {
  const normalized = events.map(normalizeEvent).slice(0, MAX_EVENTS);
  memoryCache = normalized;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fleetos-memory-updated', { detail: normalized }));
  }
  return normalized;
}

async function postMemory(payload) {
  const response = await fetch(`${API_BASE}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Fleet memory save failed with ${response.status}`);
  }
  return Array.isArray(data.events) ? data.events.map(normalizeEvent) : [];
}

export async function appendFleetMemory(event) {
  const normalized = normalizeEvent(event);
  const events = await postMemory({ event: normalized });
  return writeFleetMemory(events);
}

export async function clearFleetMemory() {
  const response = await fetch(`${API_BASE}/memory`, { method: 'DELETE' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Fleet memory delete failed with ${response.status}`);
  }
  return writeFleetMemory([]);
}

export function exportFleetMemory() {
  return JSON.stringify(readFleetMemory(), null, 2);
}

export async function syncFleetMemoryFromBackend() {
  const response = await fetch(`${API_BASE}/memory`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Fleet memory load failed with ${response.status}`);
  }
  return writeFleetMemory(Array.isArray(data.events) ? data.events : []);
}
