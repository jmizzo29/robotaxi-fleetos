const DEFAULT_TIMEOUT_MS = 5500;

function hasCoordinates(vehicle) {
  return Number.isFinite(Number(vehicle?.latitude)) && Number.isFinite(Number(vehicle?.longitude));
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(5));
}

async function fetchJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function maxNext(values = [], hours = 8) {
  const slice = values.slice(0, hours).map(Number).filter(Number.isFinite);
  return slice.length ? Math.max(...slice) : null;
}

function minNext(values = [], hours = 24) {
  const slice = values.slice(0, hours).map(Number).filter(Number.isFinite);
  return slice.length ? Math.min(...slice) : null;
}

function scoreWeatherRisk(weather) {
  const rain = Number(weather?.precipitationProbabilityMax8h || 0);
  const wind = Number(weather?.windSpeedMax12h || weather?.windSpeed || 0);
  const heat = Number(weather?.temperatureMax24h || weather?.temperature || 0);
  const cold = Number(weather?.temperatureMin24h || weather?.temperature || 70);
  let score = 10;
  if (rain >= 35) score += 18;
  if (rain >= 60) score += 18;
  if (wind >= 20) score += 12;
  if (wind >= 30) score += 10;
  if (heat >= 92 || cold <= 38) score += 10;
  return Math.min(100, score);
}

function buildWeatherRecommendations(weather) {
  const rain = Number(weather?.precipitationProbabilityMax8h || 0);
  const wind = Number(weather?.windSpeedMax12h || weather?.windSpeed || 0);
  const recommendations = [];

  if (rain >= 45) {
    recommendations.push('Add pickup buffer and covered pickup instructions because rain risk is elevated.');
    recommendations.push('Move cleaning inspections earlier so wet handoffs do not create rating risk.');
  }

  if (wind >= 25) {
    recommendations.push('Add extra battery margin for highway rentals because wind can reduce efficiency.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Weather looks normal, so keep standard charging and cleaning buffers.');
  }

  return recommendations;
}

export async function fetchWeatherContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = roundCoordinate(vehicle.latitude);
  const longitude = roundCoordinate(vehicle.longitude);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m',
    hourly: 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m',
    forecast_days: '2',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
  });

  const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  const hourly = data.hourly || {};

  const weather = {
    source: 'Open-Meteo',
    latitude,
    longitude,
    temperature: data.current?.temperature_2m,
    precipitation: data.current?.precipitation,
    windSpeed: data.current?.wind_speed_10m,
    humidity: data.current?.relative_humidity_2m,
    precipitationProbabilityMax8h: maxNext(hourly.precipitation_probability, 8),
    precipitationProbabilityMax24h: maxNext(hourly.precipitation_probability, 24),
    precipitationMax24h: maxNext(hourly.precipitation, 24),
    windSpeedMax12h: maxNext(hourly.wind_speed_10m, 12),
    temperatureMin24h: minNext(hourly.temperature_2m, 24),
    temperatureMax24h: maxNext(hourly.temperature_2m, 24),
    observedAt: data.current?.time,
  };

  return {
    ...weather,
    maintenanceRiskScore: scoreWeatherRisk(weather),
    trafficRiskScore: scoreWeatherRisk(weather),
    recommendations: buildWeatherRecommendations(weather),
  };
}

export async function fetchAirQualityContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = roundCoordinate(vehicle.latitude);
  const longitude = roundCoordinate(vehicle.longitude);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,pm2_5,ozone',
  });

  const data = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);

  return {
    source: 'Open-Meteo Air Quality',
    usAqi: data.current?.us_aqi,
    pm25: data.current?.pm2_5,
    ozone: data.current?.ozone,
    observedAt: data.current?.time,
  };
}

function normalizeOpenEiRate(rate) {
  if (!rate) return null;
  const fixedCharge = Number(rate.fixedmonthlycharge);
  const flatRate = Number(rate.flatdemandstructure?.[0]?.[0]?.rate);
  const energyRate = Number(rate.energyratestructure?.[0]?.[0]?.rate);

  return {
    utility: rate.utility || rate.utilityname || 'Unknown utility',
    name: rate.name || rate.label || 'Utility rate',
    sector: rate.sector,
    approved: Boolean(rate.approved),
    source: 'OpenEI Utility Rate Database',
    uri: rate.uri,
    energyRate: Number.isFinite(energyRate) ? energyRate : null,
    demandRate: Number.isFinite(flatRate) ? flatRate : null,
    fixedMonthlyCharge: Number.isFinite(fixedCharge) ? fixedCharge : null,
  };
}

export async function fetchElectricRateContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = roundCoordinate(vehicle.latitude);
  const longitude = roundCoordinate(vehicle.longitude);
  const apiKey = process.env.OPENEI_API_KEY || process.env.NREL_API_KEY || 'DEMO_KEY';
  const params = new URLSearchParams({
    version: 'latest',
    format: 'json',
    limit: '5',
    detail: 'full',
    sector: 'Residential',
    lat: String(latitude),
    lon: String(longitude),
    api_key: apiKey,
  });

  const data = await fetchJson(`https://api.openei.org/utility_rates?${params}`);
  const rates = Array.isArray(data.items) ? data.items.map(normalizeOpenEiRate).filter(Boolean) : [];
  const best = rates.find((rate) => rate.energyRate !== null) || rates[0] || null;

  return {
    source: 'OpenEI Utility Rate Database',
    utility: best?.utility || null,
    rateName: best?.name || null,
    energyRate: best?.energyRate ?? null,
    demandRate: best?.demandRate ?? null,
    fixedMonthlyCharge: best?.fixedMonthlyCharge ?? null,
    rateCount: rates.length,
    chargingAdvice: best?.energyRate
      ? `Estimated energy rate is $${best.energyRate.toFixed(3)}/kWh. Prefer charging below demand peaks and keep owner-entered utility rules for exact billing.`
      : 'Utility rate lookup returned a tariff, but no simple energy rate. Use this as context and confirm from the utility bill.',
  };
}

export function buildFleetContextSignals({ fleet = [], weather = null, electricRate = null } = {}) {
  const vehicles = Array.isArray(fleet) ? fleet : [];
  const avgBattery = vehicles.length
    ? vehicles.reduce((sum, vehicle) => sum + (Number(vehicle.battery) || 0), 0) / vehicles.length
    : null;
  const lowBatteryCount = vehicles.filter((vehicle) => Number(vehicle.battery) < 45).length;
  const highUtilizationCount = vehicles.filter((vehicle) => Number(vehicle.utilization) >= 80).length;
  const weekend = [5, 6, 0].includes(new Date().getDay());
  const weatherRisk = Number(weather?.trafficRiskScore || 0);

  return {
    avgBattery: Number.isFinite(avgBattery) ? Math.round(avgBattery) : null,
    lowBatteryCount,
    highUtilizationCount,
    weekend,
    trafficRisk: weatherRisk >= 65 ? 'high' : weatherRisk >= 40 ? 'medium' : 'low',
    pricingPressure: weekend || highUtilizationCount >= Math.max(1, Math.ceil(vehicles.length / 3)) ? 'elevated' : 'normal',
    chargingPressure: lowBatteryCount > 0 || Number(avgBattery) < 62 ? 'elevated' : 'normal',
    estimatedEnergyRate: electricRate?.energyRate ?? null,
  };
}

export async function getExternalContextForVehicle(vehicle) {
  const results = await Promise.allSettled([
    fetchWeatherContext(vehicle),
    fetchAirQualityContext(vehicle),
    fetchElectricRateContext(vehicle),
  ]);

  return {
    weather: results[0].status === 'fulfilled' ? results[0].value : null,
    airQuality: results[1].status === 'fulfilled' ? results[1].value : null,
    electricRate: results[2].status === 'fulfilled' ? results[2].value : null,
    generatedAt: new Date().toISOString(),
    errors: results.map((result, index) => {
      const labels = ['Weather', 'Air quality', 'Electric rates'];
      return result.status === 'rejected' ? `${labels[index]}: ${result.reason.message}` : null;
    }).filter(Boolean),
  };
}
