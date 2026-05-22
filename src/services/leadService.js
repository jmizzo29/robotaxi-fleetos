function resolveApiBase() {
  const isLocalBrowser = (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );

  return isLocalBrowser ? 'http://localhost:3001/api' : '/api';
}

export async function submitEarlyAccessLead(lead) {
  const response = await fetch(`${resolveApiBase()}/leads`, {
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
