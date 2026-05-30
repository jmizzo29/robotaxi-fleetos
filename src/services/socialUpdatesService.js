import { fetchApiJson } from './apiClient';

export async function fetchTeslaSocialUpdates(query) {
  const params = query ? `?q=${encodeURIComponent(query)}` : '';
  return fetchApiJson(`/social/x-updates${params}`);
}
