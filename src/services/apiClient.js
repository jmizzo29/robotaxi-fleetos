export function getApiBase() {
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  if (isLocalBrowser) {
    // Default to relative '/api' so Vite dev proxy can forward to the backend (localhost:3001).
    // Set VITE_LOCAL_API_BASE=http://localhost:3001/api in .env to bypass proxy and hit backend directly.
    return import.meta.env.VITE_LOCAL_API_BASE || '/api';
  }

  return '/api';
}

export function getLocalApiBase() {
  return import.meta.env.VITE_LOCAL_API_BASE || 'http://localhost:3001/api';
}

export async function readJsonResponse(response, fallback = {}) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    return JSON.parse(text);
  } catch {
    return {
      ...fallback,
      parseError: true,
      raw: text,
    };
  }
}

export async function fetchApiJson(path, options = {}) {
  const token = await getAuthToken();
  const response = await fetch(`${getApiBase()}${path}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    const rawDetail = data.raw ? `: ${String(data.raw).slice(0, 160)}` : '';
    const error = new Error(data.message || data.error || `Request failed with ${response.status}${rawDetail}`);
    error.status = response.status;
    error.code = data.error;
    throw error;
  }

  return data;
}
import { getAuthToken } from './authTokenStore';
