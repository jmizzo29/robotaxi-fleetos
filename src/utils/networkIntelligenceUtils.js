import { cybercabMarkets, recommendedExpansion } from '../data/cybercabNetwork';
import demandZones from '../data/demandZones';

const EXPANSION_SCOREBOARD = [
  { id: 'orlando', city: 'Orlando', score: 92 },
  { id: 'tampa', city: 'Tampa', score: 88 },
  { id: 'miami', city: 'Miami', score: 81 },
  { id: 'jacksonville', city: 'Jacksonville', score: 74 },
];

const EVENT_OPPORTUNITIES = [
  {
    id: 'swift-orlando',
    title: 'Taylor Swift Concert',
    place: 'Orlando',
    demandLabel: '+38% demand',
    recommendation: 'Stage 2 vehicles downtown',
    tone: 'primary',
  },
  {
    id: 'buccaneers-tampa',
    title: 'Buccaneers Game',
    place: 'Tampa',
    demandLabel: '+24% demand',
    recommendation: 'Post-game surge corridor',
    tone: 'success',
  },
  {
    id: 'iaapa-orlando',
    title: 'IAAPA Expo',
    place: 'Orlando',
    demandLabel: '+18% demand',
    recommendation: 'MCO staging window Mon–Thu',
    tone: 'warning',
  },
  {
    id: 'airport-surge',
    title: 'Airport Surge Forecast',
    place: 'Orlando MCO',
    demandLabel: '+15% demand',
    recommendation: 'Increase airport coverage after 4 PM',
    tone: 'primary',
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
    demandLabel: `+${surgePct}% demand`,
    recommendation: `Position fleet near ${zone.name}`,
    tone: zone.demand >= 90 ? 'primary' : 'success',
  };
}

/** Florida expansion scoreboard — strategic market ranking. */
export function getExpansionScoreboard() {
  return EXPANSION_SCOREBOARD;
}

/** Upcoming demand events — event-driven growth intelligence. */
export function getNetworkOpportunities(fleet = []) {
  const cities = ownerCities(fleet);
  const zoneItems = demandZones
    .filter((zone) => {
      if (!cities.length) return false;
      return cities.some((city) => zone.name.toLowerCase().includes(city.toLowerCase().split(',')[0]));
    })
    .slice(0, 1)
    .map(zoneOpportunity);

  return [...EVENT_OPPORTUNITIES, ...zoneItems].slice(0, 5);
}

/** AI expansion recommendation — monthly revenue projection. */
export function getExpansionRecommendation(fleet = []) {
  const market = cybercabMarkets.find((entry) => entry.city === recommendedExpansion);
  const ownerNearMarket = ownerCities(fleet).some((city) => {
    const normalized = city.toLowerCase();
    return normalized.includes(recommendedExpansion.toLowerCase())
      || recommendedExpansion.toLowerCase().includes(normalized.split(',')[0]);
  });

  const deployCount = ownerNearMarket ? 2 : 2;
  const monthlyBump = ownerNearMarket ? 2800 : 2400;

  return {
    city: recommendedExpansion,
    deployCount,
    deployLabel: `Deploy ${deployCount} additional vehicles to ${recommendedExpansion}`,
    projectedMonthly: monthlyBump,
    projectedLabel: `+$${monthlyBump.toLocaleString()}`,
    projectedPeriod: 'monthly revenue increase',
    confidenceLabel: ownerNearMarket ? 'High' : 'Medium',
    rationale: market?.notes || 'High-demand market with strong tourism and airport volume.',
    nearbyLive: cybercabMarkets.filter((entry) => entry.phase === 'live').length,
    projectedDaily: ownerNearMarket ? 412 : 318,
  };
}
