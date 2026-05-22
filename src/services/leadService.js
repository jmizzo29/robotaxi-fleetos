import { getApiBase } from './apiClient';

export async function submitEarlyAccessLead(lead) {
  const response = await fetch(`${getApiBase()}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Lead submission failed with ${response.status}`);
  }

  return data.lead;
}
