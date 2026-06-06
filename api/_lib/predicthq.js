const TOKEN = process.env.PREDICTHQ_TOKEN;

export async function getDemandSurges(city = "Orlando,FL,US", daysAhead = 7) {
  if (!TOKEN) {
    return { success: false, events: [], error: 'PREDICTHQ_TOKEN not configured' };
  }

  try {
    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

    const response = await fetch('https://api.predicthq.com/v1/events/', {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json'
      },
      // Note: fetch doesn't have params, so build URL
    });

    // Since fetch, we need to append query
    const url = new URL('https://api.predicthq.com/v1/events/');
    url.searchParams.set('location', city);
    url.searchParams.set('date_from', fromDate);
    url.searchParams.set('date_to', toDate);
    url.searchParams.set('category', 'concerts,sports,expos,conferences,festivals');
    url.searchParams.set('limit', '30');
    url.searchParams.set('sort', 'rank');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`PredictHQ ${res.status}`);
    }

    const data = await res.json();
    const events = data.results || [];

    const surges = events.map(event => ({
      eventName: event.title,
      date: event.start ? event.start.slice(0, 10) : '',
      category: event.category,
      expectedSurge: calculateSurge(event),
      recommendation: generateRecommendation(event)
    }));

    return {
      success: true,
      events: surges.slice(0, 8),
      totalEvents: events.length
    };
  } catch (error) {
    console.error("PredictHQ Error:", error.message);
    return { success: false, events: [], error: error.message };
  }
}

function calculateSurge(event) {
  const rank = event.rank || 50;
  return Math.round(25 + (rank / 2));
}

function generateRecommendation(event) {
  const cat = (event.category || '').toLowerCase();
  if (cat.includes('concert') || cat.includes('festival')) {
    return `Major demand expected. Increase prices 40-60% and reposition vehicles near venue.`;
  }
  if (cat.includes('sports')) {
    return `High post-game demand. Prepare for surge pricing after event ends.`;
  }
  return `Strong demand opportunity. Consider 30%+ price increase.`;
}
