export function getApiBase() {
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  if (isLocalBrowser) {
    return import.meta.env.VITE_LOCAL_API_BASE || 'http://localhost:3001/api';
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
    throw new Error(data.message || data.error || `Request failed with ${response.status}${rawDetail}`);
  }

  return data;
}
import { getAuthToken } from './authTokenStore';
