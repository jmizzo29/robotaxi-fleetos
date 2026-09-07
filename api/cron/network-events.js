import { getNetworkEvents } from '../_lib/networkEvents.js';

function isCronAuthorized(req) {
  const secret = String(process.env.CRON_SECRET || '').trim();
  const header = String(req.headers.authorization || '');
  if (secret && header === `Bearer ${secret}`) return true;
  if (req.headers['x-vercel-cron'] === '1') return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!isCronAuthorized(req)) {
    res.status(401).json({ error: 'CRON_UNAUTHORIZED' });
    return;
  }

  try {
    const payload = await getNetworkEvents({ force: true });
    res.status(200).json({
      ok: true,
      configured: payload.configured,
      provider: payload.provider,
      eventCount: payload.events.length,
      asOf: payload.asOf,
    });
  } catch (error) {
    res.status(500).json({ error: 'NETWORK_EVENTS_CRON_FAILED', message: error.message });
  }
}
