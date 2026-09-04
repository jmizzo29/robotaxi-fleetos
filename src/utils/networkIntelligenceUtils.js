import { cybercabMarkets, recommendedExpansion } from '../data/cybercabNetwork';
import demandZones from '../data/demandZones';

export const ILLUSTRATIVE_PREVIEW_DISCLAIMER = 'Illustrative preview — not live personal intelligence for your fleet.';

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
    illustrative: true,
  };
}

function emptyRecommendation() {
  return {
    city: null,
    deployCount: 0,
    deployLabel: 'No expansion forecast from your Tesla data.',
    projectedMonthly: null,
    projectedLabel: '—',
    projectedPeriod: null,
    confidenceLabel: null,
    rationale: 'Market scores, weekly dollars, and event lifts are not live owner intelligence.',
    nearbyLive: 0,
    projectedDaily: null,
    empty: true,
    illustrative: false,
    disclaimer: ILLUSTRATIVE_PREVIEW_DISCLAIMER,
  };
}

/** Florida expansion scoreboard — illustrative only unless explicitly requested. */
export function getExpansionScoreboard({ illustrative = false } = {}) {
  if (!illustrative) return [];
  return EXPANSION_SCOREBOARD.map((entry) => ({
    ...entry,
    illustrative: true,
    disclaimer: ILLUSTRATIVE_PREVIEW_DISCLAIMER,
  }));
}

/** Upcoming demand events — empty for owners; illustrative catalog on request. */
export function getNetworkOpportunities(fleet = [], { illustrative = false } = {}) {
  if (!illustrative) return [];

  const cities = ownerCities(fleet);
  const zoneItems = demandZones
    .filter((zone) => {
      if (!cities.length) return false;
      return cities.some((city) => zone.name.toLowerCase().includes(city.toLowerCase().split(',')[0]));
    })
    .slice(0, 1)
    .map(zoneOpportunity);

  return [...EVENT_OPPORTUNITIES, ...zoneItems].slice(0, 5).map((item) => ({
    ...item,
    illustrative: true,
    disclaimer: ILLUSTRATIVE_PREVIEW_DISCLAIMER,
  }));
}

/** Owner-facing expansion rec — no invented weekly/monthly dollars. */
export function getExpansionRecommendation(fleet = [], { illustrative = false } = {}) {
  if (!illustrative) {
    return emptyRecommendation();
  }

  const market = cybercabMarkets.find((entry) => entry.city === recommendedExpansion);
  const ownerNearMarket = ownerCities(fleet).some((city) => {
    const normalized = city.toLowerCase();
    return normalized.includes(recommendedExpansion.toLowerCase())
      || recommendedExpansion.toLowerCase().includes(normalized.split(',')[0]);
  });

  const deployCount = 2;
  const monthlyBump = ownerNearMarket ? 2800 : 2400;

  return {
    city: recommendedExpansion,
    deployCount,
    deployLabel: `Illustrative: deploy ${deployCount} additional vehicles to ${recommendedExpansion}`,
    projectedMonthly: monthlyBump,
    projectedLabel: `+$${monthlyBump.toLocaleString()}`,
    projectedPeriod: 'illustrative monthly revenue',
    confidenceLabel: 'Preview',
    rationale: market?.notes || ILLUSTRATIVE_PREVIEW_DISCLAIMER,
    nearbyLive: cybercabMarkets.filter((entry) => entry.phase === 'live').length,
    projectedDaily: ownerNearMarket ? 412 : 318,
    empty: false,
    illustrative: true,
    disclaimer: ILLUSTRATIVE_PREVIEW_DISCLAIMER,
  };
}

export function getGrowHero(expansion) {
  if (!expansion || expansion.empty || expansion.projectedMonthly == null) {
    return {
      amount: '—',
      subline: 'No personal weekly forecast',
      line: 'Weekly dollars and market scores are not live owner intelligence.',
    };
  }
  return {
    amount: `+$${Math.round(expansion.projectedMonthly / 4).toLocaleString()}`,
    subline: `${expansion.city} · illustrative preview`,
    line: expansion.disclaimer || ILLUSTRATIVE_PREVIEW_DISCLAIMER,
  };
}
