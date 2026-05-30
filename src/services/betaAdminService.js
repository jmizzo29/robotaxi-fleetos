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

export async function purgeBetaUser({ email, confirmation, resetToken }) {
  return fetchJson('/admin/purge-user', {
    method: 'POST',
    body: JSON.stringify({ email, confirmation, resetToken }),
  });
}
