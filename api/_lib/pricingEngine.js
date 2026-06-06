import { getDemandSurges } from './predicthq.js';

export async function calculateDynamicPrice(basePrice, vehicle, location = "Orlando,FL,US") {
  let surgeMultiplier = 1.0;
  let reason = "Base pricing";
  let priceCap = basePrice * 2.5; // Default hard cap (150% surge)

  try {
    const demand = await getDemandSurges(location, 5);

    if (demand.success && demand.events.length > 0) {
      const topEvent = demand.events[0];
      const rawSurge = topEvent.expectedSurge / 100;

      // Event-specific caps
      let eventCap = 2.0; // Default 100% surge cap

      if (topEvent.category.includes('concert') || topEvent.category.includes('festival')) {
        eventCap = 1.85; // Cap at 85% surge for big concerts
        reason = `Major event: ${topEvent.eventName}`;
      } else if (topEvent.category.includes('sports')) {
        eventCap = 2.2; // Higher for sports (post-game surges)
        reason = `Sports event surge: ${topEvent.eventName}`;
      } else if (topEvent.category.includes('conference') || topEvent.category.includes('expo')) {
        eventCap = 1.65;
        reason = `Conference surge`;
      }

      surgeMultiplier = Math.min(rawSurge, eventCap);
      priceCap = basePrice * eventCap;
    }
  } catch (e) {
    console.warn("Demand surge calculation failed, using base price");
  }

  const finalPrice = Math.min(
    Math.round(basePrice * surgeMultiplier),
    Math.round(priceCap)
  );

  return {
    basePrice: Math.round(basePrice),
    finalPrice,
    surgeMultiplier: parseFloat(surgeMultiplier.toFixed(2)),
    reason,
    priceCap: Math.round(priceCap),
    capped: finalPrice < basePrice * surgeMultiplier
  };
}
