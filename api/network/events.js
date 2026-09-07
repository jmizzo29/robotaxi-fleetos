import { getNetworkEvents } from '../_lib/networkEvents.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const force = String(req.query?.refresh || '') === '1';
  const payload = await getNetworkEvents({ force });

  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.status(200).json(payload);
}
