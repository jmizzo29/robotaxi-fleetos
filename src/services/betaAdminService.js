import { fetchApiJson } from './apiClient';

async function fetchJson(path, options) {
  return fetchApiJson(path, options);
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
