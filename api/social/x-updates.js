const DEFAULT_QUERY = '("Tesla robotaxi" OR "Tesla Robotaxi" OR Cybercab OR Cybercabs OR "Tesla Cybercab" OR "Tesla ride-hailing" OR "Tesla ride hailing" OR "Tesla autonomous") lang:en -is:retweet';

const DEMO_UPDATES = [
  {
    id: 'demo-cybercab-watch',
    text: 'Cybercab signal watch: track Tesla Cybercab, Robotaxi network, and autonomous ride-hailing updates before changing owner fleet assumptions.',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    authorName: 'RoboAgent Signal',
    username: 'roboagent',
    url: null,
    metrics: { like_count: 0, reply_count: 0, retweet_count: 0, quote_count: 0 },
    tags: ['cybercab', 'robotaxi'],
    sentiment: 'watch',
  },
  {
    id: 'demo-robotaxi-watch',
    text: 'Tesla Robotaxi update watch: monitor service-area news, launch timing, owner eligibility, and operating constraints as they become public.',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    authorName: 'RoboAgent Signal',
    username: 'roboagent',
    url: null,
    metrics: { like_count: 0, reply_count: 0, retweet_count: 0, quote_count: 0 },
    tags: ['robotaxi', 'policy'],
    sentiment: 'watch',
  },
  {
    id: 'demo-autonomy-policy',
    text: 'Autonomy policy signal: watch regulatory, safety, and deployment updates that could affect Tesla Robotaxi availability by market.',
    createdAt: new Date(Date.now() - 1000 * 60 * 76).toISOString(),
    authorName: 'RoboAgent Signal',
    username: 'roboagent',
    url: null,
    metrics: { like_count: 0, reply_count: 0, retweet_count: 0, quote_count: 0 },
    tags: ['robotaxi', 'policy'],
    sentiment: 'neutral',
  },
];

function getBearerToken() {
  return process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || '';
}

function tagUpdate(text = '') {
  const lower = text.toLowerCase();
  const tags = [];
  if (/cybercab/.test(lower)) tags.push('cybercab');
  if (/robotaxi|cybercab|autonomous|fsd/.test(lower)) tags.push('robotaxi');
  if (/service area|rollout|launch|available|deployment|market/.test(lower)) tags.push('rollout');
  if (/regulat|policy|permit|approval|safety|nhtsa/.test(lower)) tags.push('policy');
  if (/tesla|tsla/.test(lower)) tags.push('tesla');
  return tags.length ? tags.slice(0, 4) : ['tesla'];
}

function inferSentiment(text = '') {
  const lower = text.toLowerCase();
  if (/delay|issue|warning|risk|recall|crash|investigation|blocked|problem/.test(lower)) return 'watch';
  if (/launch|expand|available|approval|growth|rollout|deployment|service area/.test(lower)) return 'opportunity';
  return 'neutral';
}

function isTeslaRobotaxiUpdate(text = '') {
  const lower = text.toLowerCase();
  return (
    lower.includes('cybercab') ||
    lower.includes('tesla robotaxi') ||
    lower.includes('tesla autonomous') ||
    lower.includes('tesla ride-hailing') ||
    lower.includes('tesla ride hailing') ||
    (lower.includes('tesla') && lower.includes('robotaxi'))
  );
}

function normalizeXResponse(data) {
  const usersById = new Map((data.includes?.users || []).map((user) => [user.id, user]));
  return (data.data || []).filter((tweet) => isTeslaRobotaxiUpdate(tweet.text)).map((tweet) => {
    const user = usersById.get(tweet.author_id) || {};
    const username = user.username || 'x';
    return {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      authorName: user.name || username,
      username,
      url: `https://x.com/${username}/status/${tweet.id}`,
      metrics: tweet.public_metrics || {},
      tags: tagUpdate(tweet.text),
      sentiment: inferSentiment(tweet.text),
    };
  });
}

function fallbackPayload({ configured = false, degraded = false, error = null, query = DEFAULT_QUERY } = {}) {
  return {
    configured,
    degraded,
    source: configured ? 'fallback' : 'demo',
    query,
    fetchedAt: new Date().toISOString(),
    error,
    updates: DEMO_UPDATES,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const bearerToken = getBearerToken();
  const query = String(req.query?.q || DEFAULT_QUERY).slice(0, 450);

  res.setHeader('Cache-Control', 's-maxage=90, stale-while-revalidate=300');

  if (!bearerToken) {
    res.status(200).json(fallbackPayload({ configured: false, query }));
    return;
  }

  const params = new URLSearchParams({
    query,
    max_results: '10',
    'tweet.fields': 'created_at,author_id,public_metrics,lang,entities,context_annotations',
    expansions: 'author_id',
    'user.fields': 'username,name,verified,profile_image_url',
  });

  try {
    const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.detail || data.title || data.error || `X API request failed with ${response.status}`;
      res.status(200).json(fallbackPayload({
        configured: true,
        degraded: true,
        error: message,
        query,
      }));
      return;
    }

    res.status(200).json({
      configured: true,
      degraded: false,
      source: 'x-api',
      query,
      fetchedAt: new Date().toISOString(),
      updates: normalizeXResponse(data),
    });
  } catch (error) {
    res.status(200).json(fallbackPayload({
      configured: true,
      degraded: true,
      error: error.message,
      query,
    }));
  }
}
