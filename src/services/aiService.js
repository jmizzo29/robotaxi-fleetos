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
