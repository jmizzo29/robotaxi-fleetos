function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function revenueForVehicleRecords(vehicle, records = []) {
  const keys = new Set([
    vehicle?.vin,
    vehicle?.id,
    vehicle?.name,
    vehicle?.display_name,
  ].filter(Boolean));

  return records
    .filter((record) => keys.has(record.vehicleKey) || keys.has(record.vehicleLabel))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function isWeekend(date = new Date()) {
  return [5, 6, 0].includes(date.getDay());
}

function nearbyEventSignal(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();
  const weekend = isWeekend(date);

  if (weekend && [0, 1, 2, 5, 6, 10, 11].includes(month)) {
    return {
      label: 'Weekend leisure demand',
      detail: 'Weekend travel and local events often create stronger renter demand.',
      lift: 8,
      confidence: 68,
    };
  }

  if ((month === 10 && day >= 20) || (month === 11 && day <= 31) || (month === 6 && day <= 7)) {
    return {
      label: 'Holiday travel window',
      detail: 'Holiday travel windows often justify higher pricing when utilization is healthy.',
      lift: 12,
      confidence: 74,
    };
  }

  return {
    label: 'Normal event pressure',
    detail: 'No major calendar pressure detected from built-in holiday/weekend logic.',
    lift: 0,
    confidence: 52,
  };
}

function healthPremium(vehicle) {
  const maintenance = Number(vehicle?.maintenanceScore ?? 85);
  const anomaly = Number(vehicle?.anomalyRisk ?? 8);
  const battery = Number(vehicle?.battery ?? 70);
  const score = Math.round((maintenance * 0.48) + ((100 - anomaly) * 0.32) + (battery * 0.2));

  if (score >= 92) return { score, lift: 8, detail: 'Excellent readiness can justify a modest premium.' };
  if (score >= 84) return { score, lift: 3, detail: 'Good readiness supports holding price.' };
  if (score < 72) return { score, lift: -8, detail: 'Health risk should reduce price or pause aggressive bookings.' };
  return { score, lift: -2, detail: 'Readiness is acceptable but not strong enough for premium pricing.' };
}

function weatherDemandSignal(weather) {
  const rain = Number(weather?.precipitationProbabilityMax8h || weather?.precipitationProbability || 0);
  const wind = Number(weather?.windSpeedMax12h || weather?.windSpeed || 0);
  const temperature = Number(weather?.temperature || 72);

  if (rain >= 60 || wind >= 30) {
    return {
      label: 'Weather friction',
      lift: -6,
      confidence: 72,
      detail: 'Heavy rain or wind can reduce renter demand and increase handoff risk.',
    };
  }

  if (temperature >= 62 && temperature <= 84 && rain < 25 && wind < 18) {
    return {
      label: 'Favorable weather',
      lift: 5,
      confidence: 70,
      detail: 'Comfortable weather can improve leisure and local-trip demand.',
    };
  }

  return {
    label: 'Neutral weather',
    lift: 0,
    confidence: 58,
    detail: 'Weather does not strongly push pricing up or down.',
  };
}

function utilizationSignal(vehicle) {
  const utilization = Number(vehicle?.utilization ?? 60);
  if (utilization >= 85) return { utilization, lift: 10, detail: 'High utilization suggests pricing power.' };
  if (utilization >= 72) return { utilization, lift: 5, detail: 'Healthy utilization supports a small increase.' };
  if (utilization <= 45) return { utilization, lift: -10, detail: 'Low utilization suggests lowering price to win bookings.' };
  return { utilization, lift: 0, detail: 'Utilization is balanced.' };
}

function revenueSignal(vehicle, revenueRecords = []) {
  const revenue = revenueForVehicleRecords(vehicle, revenueRecords);
  const utilization = Number(vehicle?.utilization ?? 60);
  if (!revenue) {
    return {
      revenue,
      lift: 0,
      detail: 'No imported historical earnings yet. Upload Turo CSV to improve confidence.',
      confidencePenalty: 12,
    };
  }

  const revenuePerUtilizationPoint = revenue / Math.max(1, utilization);
  if (revenuePerUtilizationPoint >= 45) {
    return {
      revenue,
      lift: 5,
      detail: 'Historical earnings look strong relative to utilization.',
      confidencePenalty: 0,
    };
  }

  if (revenuePerUtilizationPoint <= 22) {
    return {
      revenue,
      lift: -5,
      detail: 'Historical earnings look weak relative to utilization.',
      confidencePenalty: 0,
    };
  }

  return {
    revenue,
    lift: 0,
    detail: 'Historical earnings are in a normal range.',
    confidencePenalty: 0,
  };
}

export function buildPricingRecommendations({
  fleet = [],
  revenueRecords = [],
  weather = null,
  date = new Date(),
} = {}) {
  const event = nearbyEventSignal(date);
  const weatherSignal = weatherDemandSignal(weather);

  return fleet.map((vehicle) => {
    const health = healthPremium(vehicle);
    const utilization = utilizationSignal(vehicle);
    const revenue = revenueSignal(vehicle, revenueRecords);
    const rawLift = event.lift + weatherSignal.lift + health.lift + utilization.lift + revenue.lift;
    const recommendedChange = clamp(Math.round(rawLift), -20, 25);
    const confidence = clamp(
      Math.round(55 + event.confidence * 0.12 + weatherSignal.confidence * 0.12 + health.score * 0.18 + Math.min(20, Math.abs(recommendedChange)) - revenue.confidencePenalty),
      45,
      94,
    );

    const action = recommendedChange >= 12
      ? 'Increase price'
      : recommendedChange <= -8
        ? 'Lower price'
        : recommendedChange > 0
          ? 'Test small increase'
          : 'Hold price';

    return {
      id: `pricing-${vehicle.vin || vehicle.id}`,
      vehicle,
      title: `${action} ${Math.abs(recommendedChange)}%`,
      recommendedChange,
      confidence,
      healthScore: health.score,
      utilization: utilization.utilization,
      revenue: revenue.revenue,
      signals: [
        { label: event.label, detail: event.detail, impact: event.lift },
        { label: weatherSignal.label, detail: weatherSignal.detail, impact: weatherSignal.lift },
        { label: `Health score ${health.score}`, detail: health.detail, impact: health.lift },
        { label: `Utilization ${Math.round(utilization.utilization)}%`, detail: utilization.detail, impact: utilization.lift },
        { label: revenue.revenue ? 'Historical earnings' : 'Historical earnings missing', detail: revenue.detail, impact: revenue.lift },
      ],
    };
  }).sort((a, b) => Math.abs(b.recommendedChange) - Math.abs(a.recommendedChange));
}

export function buildFleetPricingSummary(recommendations = []) {
  if (!recommendations.length) {
    return {
      averageChange: 0,
      strongest: null,
      detail: 'No pricing recommendations available yet.',
    };
  }

  const averageChange = Math.round(
    recommendations.reduce((sum, item) => sum + item.recommendedChange, 0) / recommendations.length,
  );
  const strongest = recommendations[0];

  return {
    averageChange,
    strongest,
    detail: `${strongest.vehicle.name || strongest.vehicle.display_name || strongest.vehicle.id} has the strongest pricing action at ${strongest.recommendedChange > 0 ? '+' : ''}${strongest.recommendedChange}%.`,
  };
}
