import { fetchApiJson } from './apiClient';

export async function getAiFleetAnalysis({ fleet, context = {} }) {
  return fetchApiJson('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({
      fleet,
      context,
    }),
  });
}

export async function askRoboAgent({ question }) {
  return fetchApiJson('/agent/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
