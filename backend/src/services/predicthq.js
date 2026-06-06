const axios = require('axios');

const TOKEN = process.env.PREDICTHQ_TOKEN;

async function getDemandSurges(city = "Orlando,FL,US", daysAhead = 7) {
  try {
    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

    const response = await axios.get('https://api.predicthq.com/v1/events/', {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json'
      },
      params: {
        location: city,
        date_from: fromDate,
        date_to: toDate,
        category: 'concerts,sports,expos,conferences,festivals',
        limit: 30,
        sort: 'rank'
      }
    });

    const events = response.data.results;

    // Generate surge recommendations
    const surges = events.map(event => ({
      eventName: event.title,
      date: event.start.slice(0, 10),
      category: event.category,
      expectedSurge: calculateSurge(event),
      recommendation: generateRecommendation(event)
    }));

    return {
      success: true,
      events: surges.slice(0, 8), // Top 8 impactful events
      totalEvents: events.length
    };
  } catch (error) {
    console.error("PredictHQ Error:", error.response?.data || error.message);
    return { success: false, events: [], error: error.message };
  }
}

function calculateSurge(event) {
  const rank = event.rank || 50;
  return Math.round(25 + (rank / 2)); // 25% to 75% surge
}

function generateRecommendation(event) {
  if (event.category.includes('concert') || event.category.includes('festival')) {
    return `Major demand expected. Increase prices 40-60% and reposition vehicles near venue.`;
  }
  if (event.category.includes('sports')) {
    return `High post-game demand. Prepare for surge pricing after event ends.`;
  }
  return `Strong demand opportunity. Consider 30%+ price increase.`;
}

module.exports = { getDemandSurges };
