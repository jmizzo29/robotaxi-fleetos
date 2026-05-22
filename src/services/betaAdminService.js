function apiBase() {
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );
  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

async function fetchJson(path, options) {
  const response = await fetch(`${apiBase()}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with ${response.status}`);
  }
  return data;
}

export async function submitBetaFeedback(feedback) {
  return fetchJson('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

export async function getBetaAdminSummary() {
  return fetchJson('/admin');
}
