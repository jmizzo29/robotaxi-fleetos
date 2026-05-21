function resolveApiBase() {
  const configuredBase = import.meta.env.VITE_TESLA_API_BASE;
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  if (configuredBase && !configuredBase.includes('localhost') && !configuredBase.includes('127.0.0.1')) {
    return configuredBase;
  }

  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

const API_BASE = resolveApiBase();

export async function getAiFleetAnalysis({ fleet, context = {} }) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fleet,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed with status ${response.status}`);
  }

  return response.json();
}
