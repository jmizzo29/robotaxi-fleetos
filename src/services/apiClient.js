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

export async function fetchApiJson(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with ${response.status}`);
  }

  return data;
}
