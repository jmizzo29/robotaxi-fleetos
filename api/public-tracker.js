export default async function handler(req, res) {
  const { provider = 'tesla', area = 'austin' } = req.query || {};

  const url = `https://robotaxitracker.com/?provider=${encodeURIComponent(provider)}&area=${encodeURIComponent(area)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ROBOAGENT/1.0 (+https://roboagent-fleet.vercel.app; public tracker integration)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      throw new Error(`Tracker returned ${response.status}`);
    }

    const html = await response.text();

    // Basic extraction for title and any visible count hints (the real vehicle list is rendered client-side)
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Robotaxi Tracker';

    // Look for any obvious count or "X vehicles" text in the initial HTML (often in meta or headings)
    const countMatch = html.match(/(\d+)\s*(vehicles?|robotaxis?|cybercabs?)/i);
    const vehicleHint = countMatch ? countMatch[0] : null;

    res.setHeader('Cache-Control', 'public, max-age=60'); // short cache for live-ish data

    res.status(200).json({
      source: 'robotaxitracker.com',
      url,
      title,
      vehicleHint,
      note: 'Public real-time sightings of Tesla robotaxis (Austin and other areas). The full interactive list and map are rendered client-side by the tracker. This endpoint proxies the page (to avoid CORS) and extracts basic metadata. For production-grade structured vehicle data, consider official sources or direct partnerships.',
      provider,
      area,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(502).json({
      error: 'Failed to reach public tracker',
      details: err.message,
      url
    });
  }
}
