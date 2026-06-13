import { cybercabMarkets, recommendedExpansion } from '../data/cybercabNetwork';
import demandZones from '../data/demandZones';

const EVENT_OPPORTUNITIES = [
  {
    id: 'swift-orlando',
    title: 'Taylor Swift Concert',
    place: 'Orlando',
    demandLabel: '+38% expected demand',
    recommendation: 'Stage 2 vehicles downtown',
    tone: 'primary',
  },
  {
    id: 'buccaneers-tampa',
    title: 'Buccaneers Game',
    place: 'Tampa',
    demandLabel: '+24% expected demand',
    recommendation: 'Post-game surge corridor',
    tone: 'success',
  },
  {
    id: 'iaapa-orlando',
    title: 'IAAPA Expo',
    place: 'Orlando',
    demandLabel: '+18% expected airport demand',
    recommendation: 'MCO staging window Mon–Thu',
    tone: 'warning',
  },
];

function ownerCities(fleet = []) {
  return [...new Set(
    fleet
      .map((vehicle) => String(vehicle.city || '').trim())
      .filter(Boolean),
  )];
}

function zoneOpportunity(zone) {
  const surgePct = Math.round((zone.surgeMultiplier - 1) * 100);
  return {
    id: `zone-${zone.name}`,
    title: zone.name,
    place: zone.name.includes('Orlando') || zone.name.includes('Disney') ? 'Orlando' : 'Florida',
    demandLabel: `+${surgePct}% surge corridor`,
    recommendation: `Position fleet near ${zone.name}`,
    tone: zone.demand >= 90 ? 'primary' : 'success',
  };
}

/** v3 Network opportunities — event-driven demand intelligence. */
export function getNetworkOpportunities(fleet = []) {
  const cities = ownerCities(fleet);
  const zoneItems = demandZones
    .filter((zone) => {
      if (!cities.length) return true;
      return cities.some((city) => zone.name.toLowerCase().includes(city.toLowerCase().split(',')[0]));
    })
    .slice(0, 1)
    .map(zoneOpportunity);

  return [...EVENT_OPPORTUNITIES, ...zoneItems].slice(0, 4);
}

/** v3 Network expansion recommendation. */
export function getExpansionRecommendation(fleet = []) {
  const market = cybercabMarkets.find((entry) => entry.city === recommendedExpansion);
  const ownerNearMarket = ownerCities(fleet).some((city) => {
    const normalized = city.toLowerCase();
    return normalized.includes(recommendedExpansion.toLowerCase())
      || recommendedExpansion.toLowerCase().includes(normalized.split(',')[0]);
  });

  const baseProjection = ownerNearMarket ? 412 : 318;

  return {
    city: recommendedExpansion,
    projectedDaily: baseProjection,
    projectedLabel: `+$${baseProjection}/day`,
    rationale: market?.notes || 'High-demand market with strong tourism and airport volume.',
    nearbyLive: cybercabMarkets.filter((entry) => entry.phase === 'live').length,
  };
}
