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

export function hasAdminAccess() {
  return localStorage.getItem('fleetos.adminAccess.v1') === 'granted';
}

export function verifyAdminCode(code) {
  const expected = import.meta.env.VITE_ADMIN_INVITE_CODE || 'FLEETOS-ADMIN';
  const ok = String(code || '').trim().toUpperCase() === expected.toUpperCase();
  if (ok) {
    localStorage.setItem('fleetos.adminAccess.v1', 'granted');
  }
  return ok;
}
