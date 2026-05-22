import { getApiBase } from './apiClient';

const API_BASE = getApiBase();

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
