const FLORIDA_MARKETS = [
  {
    city: 'Orlando',
    state: 'FL',
    latitude: 28.5383,
    longitude: -81.3792,
    demand: 'Very high',
    confidence: 82,
    ownerUseCases: ['airport rentals', 'theme-park trips', 'family travel', 'weekend visitors'],
    topTeslaModels: [
      { model: 'Tesla Model Y', reason: 'Best mix of seats, cargo room, range, and family-rental appeal.' },
      { model: 'Tesla Model 3', reason: 'Often books well when priced competitively for airport and short-trip renters.' },
      { model: 'Tesla Model X', reason: 'Premium family demand, but higher price sensitivity and maintenance reserve.' },
    ],
    pricingNote: 'Orlando usually rewards clean, airport-ready Model Y listings with flexible pickup instructions.',
    supplyEstimate: {
      'Tesla Model 3': { range: '45-70', pressure: 'High', note: 'Model 3 supply is usually broad, so photos, delivery convenience, and price matter.' },
      'Tesla Model Y': { range: '55-85', pressure: 'High', note: 'Model Y supply is deep but demand is also strong around airport and family travel.' },
      'Tesla Model X': { range: '8-16', pressure: 'Moderate', note: 'Model X is less common and can work as a premium family option.' },
      'Tesla Model S': { range: '10-18', pressure: 'Moderate', note: 'Premium sedan demand exists but is more price sensitive than Model Y.' },
      'Tesla Cybertruck': { range: '4-10', pressure: 'Low', note: 'Cybertruck supply is limited and novelty can support premium pricing.' },
    },
  },
  {
    city: 'Tampa',
    state: 'FL',
    latitude: 27.9506,
    longitude: -82.4572,
    demand: 'High',
    confidence: 78,
    ownerUseCases: ['airport rentals', 'beach trips', 'sports/events', 'business travel'],
    topTeslaModels: [
      { model: 'Tesla Model Y', reason: 'Strong all-purpose rental for airport, beach, and family use.' },
      { model: 'Tesla Model 3', reason: 'Good price-to-range fit for business and weekend renters.' },
      { model: 'Tesla Cybertruck', reason: 'Can command attention-driven premium pricing when supply is limited.' },
    ],
    pricingNote: 'Tampa pricing should react to airport demand, beaches, concerts, Lightning/Bucs events, and weekend weather.',
    supplyEstimate: {
      'Tesla Model 3': { range: '30-55', pressure: 'High', note: 'Model 3 competition is usually strongest on price and airport convenience.' },
      'Tesla Model Y': { range: '38-65', pressure: 'High', note: 'Model Y demand is strong for beach, airport, and family trips.' },
      'Tesla Model X': { range: '5-12', pressure: 'Moderate', note: 'Model X is a smaller premium segment with repair-reserve risk.' },
      'Tesla Model S': { range: '6-14', pressure: 'Moderate', note: 'Model S can work for business and premium renters.' },
      'Tesla Cybertruck': { range: '3-8', pressure: 'Low', note: 'Cybertruck supply is thin and event-driven pricing may work.' },
    },
  },
  {
    city: 'Lakeland',
    state: 'FL',
    latitude: 28.0395,
    longitude: -81.9498,
    demand: 'Moderate',
    confidence: 70,
    ownerUseCases: ['Central Florida positioning', 'local replacement rentals', 'Orlando/Tampa overflow'],
    topTeslaModels: [
      { model: 'Tesla Model 3', reason: 'Lower daily price can win practical local demand and longer bookings.' },
      { model: 'Tesla Model Y', reason: 'Works well when staged as a midpoint between Tampa and Orlando.' },
      { model: 'Tesla Model S', reason: 'Niche premium option; likely needs strong photos and competitive pricing.' },
    ],
    pricingNote: 'Lakeland is better treated as a positioning market unless owner history proves strong local bookings.',
    supplyEstimate: {
      'Tesla Model 3': { range: '8-16', pressure: 'Moderate', note: 'Model 3 is likely the most common local Tesla rental and competes on price.' },
      'Tesla Model Y': { range: '6-14', pressure: 'Moderate', note: 'Model Y can work well between Tampa and Orlando if delivery is flexible.' },
      'Tesla Model X': { range: '1-4', pressure: 'Low', note: 'Model X supply is likely thin in Lakeland, but demand may be niche and intermittent.' },
      'Tesla Model S': { range: '1-5', pressure: 'Low', note: 'Model S is a niche premium option in Lakeland.' },
      'Tesla Cybertruck': { range: '0-3', pressure: 'Low', note: 'Cybertruck availability is likely scarce and novelty-driven.' },
    },
  },
  {
    city: 'Miami',
    state: 'FL',
    latitude: 25.7617,
    longitude: -80.1918,
    demand: 'Very high',
    confidence: 80,
    ownerUseCases: ['airport rentals', 'luxury travel', 'events/nightlife', 'beach trips'],
    topTeslaModels: [
      { model: 'Tesla Model Y', reason: 'Broad demand and practical utility.' },
      { model: 'Tesla Model S', reason: 'Premium/luxury positioning can work better here than smaller markets.' },
      { model: 'Tesla Cybertruck', reason: 'High novelty value if priced and insured correctly.' },
    ],
    pricingNote: 'Miami can support premium positioning, but competition and guest expectations are higher.',
    supplyEstimate: {
      'Tesla Model 3': { range: '65-100', pressure: 'Very high', note: 'Model 3 supply is deep and competitive in Miami.' },
      'Tesla Model Y': { range: '70-110', pressure: 'Very high', note: 'Model Y demand is strong but competition is heavy.' },
      'Tesla Model X': { range: '14-28', pressure: 'Moderate', note: 'Model X can fit premium/luxury family trips.' },
      'Tesla Model S': { range: '18-34', pressure: 'High', note: 'Model S has more premium competition in Miami than smaller Florida markets.' },
      'Tesla Cybertruck': { range: '8-18', pressure: 'Moderate', note: 'Cybertruck novelty can work well if priced carefully.' },
    },
  },
  {
    city: 'Jacksonville',
    state: 'FL',
    latitude: 30.3322,
    longitude: -81.6557,
    demand: 'Moderate',
    confidence: 68,
    ownerUseCases: ['airport rentals', 'military/business travel', 'regional road trips'],
    topTeslaModels: [
      { model: 'Tesla Model Y', reason: 'Best all-around fit for families and longer regional trips.' },
      { model: 'Tesla Model 3', reason: 'Competitive pricing can drive utilization.' },
      { model: 'Tesla Model X', reason: 'Premium family use, but watch repair reserve and price sensitivity.' },
    ],
    pricingNote: 'Jacksonville likely benefits from conservative pricing and strong delivery convenience.',
    supplyEstimate: {
      'Tesla Model 3': { range: '14-28', pressure: 'Moderate', note: 'Model 3 is practical but price-sensitive in Jacksonville.' },
      'Tesla Model Y': { range: '18-34', pressure: 'Moderate', note: 'Model Y is likely the strongest all-around rental fit.' },
      'Tesla Model X': { range: '3-8', pressure: 'Low', note: 'Model X is a limited premium family segment.' },
      'Tesla Model S': { range: '4-9', pressure: 'Low', note: 'Model S can work for business travel, but volume may be uneven.' },
      'Tesla Cybertruck': { range: '1-5', pressure: 'Low', note: 'Cybertruck is likely supply-constrained and event-sensitive.' },
    },
  },
];

const CITY_ALIASES = {
  orl: 'Orlando',
  orlando: 'Orlando',
  tampa: 'Tampa',
  lakeland: 'Lakeland',
  laklenad: 'Lakeland',
  miami: 'Miami',
  jacksonville: 'Jacksonville',
  jax: 'Jacksonville',
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function isMarketQuestion(question = '') {
  const lower = normalize(question);
  return ['top rented', 'best rented', 'most rented', 'market', 'which tesla', 'what teslas', 'rental demand', 'rent best', 'how many', 'available', 'availability', 'rental supply', 'competition']
    .some((term) => lower.includes(term));
}

export function extractTeslaModelFromQuestion(question = '') {
  const lower = normalize(question).replace(/model\s+(\d)/g, 'model $1');
  const modelMap = [
    ['model x', 'Tesla Model X'],
    ['model y', 'Tesla Model Y'],
    ['model 3', 'Tesla Model 3'],
    ['model s', 'Tesla Model S'],
    ['cybertruck', 'Tesla Cybertruck'],
    ['cybercab', 'Tesla Cybercab'],
  ];
  return modelMap.find(([term]) => lower.includes(term))?.[1] || null;
}

export function findMarketByCity(city) {
  const canonical = CITY_ALIASES[normalize(city)] || city;
  return FLORIDA_MARKETS.find((market) => normalize(market.city) === normalize(canonical)) || null;
}

export function extractMarketFromQuestion(question = '') {
  const lower = normalize(question);
  const alias = Object.keys(CITY_ALIASES).find((key) => lower.includes(key));
  if (alias) return findMarketByCity(CITY_ALIASES[alias]);
  if (lower.includes('florida') || lower.includes('state')) return findMarketByCity('Orlando');
  return null;
}

export function distanceMiles(a, b) {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const earthRadiusMiles = 3958.8;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function inferVehicleMarket(vehicle, markets = FLORIDA_MARKETS) {
  const explicit = findMarketByCity(vehicle?.city || vehicle?.market || vehicle?.homeMarket);
  if (explicit) return { market: explicit, miles: 0, source: 'vehicle city' };

  if (Number.isFinite(Number(vehicle?.latitude)) && Number.isFinite(Number(vehicle?.longitude))) {
    const ranked = markets
      .map((market) => ({ market, miles: distanceMiles(vehicle, market) }))
      .filter((item) => Number.isFinite(item.miles))
      .sort((a, b) => a.miles - b.miles);
    if (ranked[0]) return { ...ranked[0], source: 'vehicle GPS' };
  }

  return { market: findMarketByCity('Orlando'), miles: null, source: 'default Central Florida base' };
}

export function inferOwnerMarket(fleet = []) {
  const realOrFirst = fleet.find((vehicle) => vehicle.isReal) || fleet[0];
  if (realOrFirst) return inferVehicleMarket(realOrFirst);
  return { market: findMarketByCity('Orlando'), miles: null, source: 'default Central Florida base' };
}

export function buildMarketRentalAnswer(question = '', fleet = []) {
  const requestedMarket = extractMarketFromQuestion(question);
  const ownerMarket = inferOwnerMarket(fleet);
  const market = requestedMarket || ownerMarket.market || findMarketByCity('Orlando');
  const requestedModel = extractTeslaModelFromQuestion(question);
  const nearbyVehicles = fleet
    .map((vehicle) => {
      const location = inferVehicleMarket(vehicle);
      const miles = distanceMiles(vehicle, market);
      return {
        vehicle,
        location,
        miles,
      };
    })
    .filter((item) => item.location?.market?.city === market.city || (Number.isFinite(item.miles) && item.miles < 75))
    .sort((a, b) => (a.miles ?? 999) - (b.miles ?? 999))
    .slice(0, 3);

  const supply = requestedModel ? market.supplyEstimate?.[requestedModel] : null;
  const metrics = supply ? [
    `${market.city} ${requestedModel.replace('Tesla ', '')}: ${supply.range} comparable rentals`,
    `Competition: ${supply.pressure}`,
    `${market.confidence}% confidence`,
  ] : [
    `${market.city} demand: ${market.demand}`,
    `${market.confidence}% confidence`,
    `${nearbyVehicles.length || 'No'} nearby fleet match${nearbyVehicles.length === 1 ? '' : 'es'}`,
  ];

  const steps = supply ? [
    `Estimated active comparable ${requestedModel.replace('Tesla ', '')} rentals near ${market.city}: ${supply.range}.`,
    supply.note,
    market.pricingNote,
    'This is a RoboAgent market estimate, not a live Turo scrape. Connect owner history or import Turo CSVs to make it sharper.',
  ] : [
    `Likely top rented Tesla in ${market.city}: ${market.topTeslaModels[0].model}. ${market.topTeslaModels[0].reason}`,
    `Second: ${market.topTeslaModels[1].model}. ${market.topTeslaModels[1].reason}`,
    `Third: ${market.topTeslaModels[2].model}. ${market.topTeslaModels[2].reason}`,
    market.pricingNote,
  ];

  if (nearbyVehicles.length > 0) {
    steps.push(`Your closest relevant vehicle context: ${nearbyVehicles.map((item) => `${item.vehicle.ownership?.tag || item.vehicle.name || item.vehicle.id} (${item.location.source}${Number.isFinite(item.miles) ? `, ${Math.round(item.miles)} mi from ${market.city}` : ''})`).join('; ')}.`);
  } else {
    steps.push(`I do not see a connected vehicle clearly staged in ${market.city} yet. Add vehicle home base or sync GPS to make this answer owner-specific.`);
  }

  return {
    title: supply ? `${requestedModel.replace('Tesla ', '')} rental availability in ${market.city}` : `Top rented Teslas in ${market.city}`,
    summary: supply
      ? `I estimate ${supply.range} comparable ${requestedModel.replace('Tesla ', '')} rentals around ${market.city}. Competition looks ${supply.pressure.toLowerCase()}, so an owner should validate price, delivery radius, and trip history before buying or staging a vehicle there.`
      : `For ${market.city}, I would rank demand as ${market.topTeslaModels.map((item) => item.model.replace('Tesla ', '')).join(' > ')}. This is a market-intelligence estimate from demand patterns, owner fleet context, and local use cases, not a live Turo scrape.`,
    metrics,
    steps,
    confidence: market.confidence,
    impact: supply
      ? `Use this to size the local rental market before buying, pricing, or moving a Tesla. RoboAgent should improve this with owner location, imported Turo history, and manual market-rate inputs.`
      : `Use this to choose which vehicle to buy, where to stage it, and how aggressively to price it. For paid users, RoboAgent should improve this with imported Turo history, owner vehicle locations, and city-specific booking performance.`,
  };
}

export { FLORIDA_MARKETS };
