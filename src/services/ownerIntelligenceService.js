import { hasCoordinates } from './locationIntelligence';
import { fetchApiJson, readJsonResponse } from './apiClient';

function normalizeVin(vin) {
  return String(vin || '').trim().toUpperCase();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await readJsonResponse(response, null);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  if (!data) {
    throw new Error('Request returned an empty response.');
  }
  return data;
}

export async function getWeatherContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = Number(vehicle.latitude).toFixed(5);
  const longitude = Number(vehicle.longitude).toFixed(5);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=1&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  const data = await fetchJson(url);

  return {
    temperature: data.current?.temperature_2m,
    precipitation: data.current?.precipitation,
    windSpeed: data.current?.wind_speed_10m,
    humidity: data.current?.relative_humidity_2m,
    precipitationProbability: Math.max(...(data.hourly?.precipitation_probability || [0]).slice(0, 8)),
    precipitationProbabilityMax24h: Math.max(...(data.hourly?.precipitation_probability || [0]).slice(0, 24)),
    windSpeedMax12h: Math.max(...(data.hourly?.wind_speed_10m || [0]).slice(0, 12)),
    temperatureMin24h: Math.min(...(data.hourly?.temperature_2m || [data.current?.temperature_2m]).slice(0, 24)),
    temperatureMax24h: Math.max(...(data.hourly?.temperature_2m || [data.current?.temperature_2m]).slice(0, 24)),
    observedAt: data.current?.time,
  };
}

export async function getAirQualityContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = Number(vehicle.latitude).toFixed(5);
  const longitude = Number(vehicle.longitude).toFixed(5);
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,ozone`;
  const data = await fetchJson(url);

  return {
    usAqi: data.current?.us_aqi,
    pm25: data.current?.pm2_5,
    ozone: data.current?.ozone,
    observedAt: data.current?.time,
  };
}

export async function decodeVehicleVin(vin) {
  const normalizedVin = normalizeVin(vin);
  if (!normalizedVin || normalizedVin.length < 11) return null;

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(normalizedVin)}?format=json`;
  const data = await fetchJson(url);
  const result = data.Results?.[0];

  if (!result) return null;

  return {
    vin: normalizedVin,
    make: result.Make,
    model: result.Model,
    modelYear: result.ModelYear,
    bodyClass: result.BodyClass,
    fuelType: result.FuelTypePrimary,
    plantCountry: result.PlantCountry,
    trim: result.Trim,
    errorCode: result.ErrorCode,
    errorText: result.ErrorText,
  };
}

export async function getOwnerIntelligence(vehicle) {
  const [externalResult, vinResult] = await Promise.allSettled([
    fetchApiJson('/owner-context', {
      method: 'POST',
      body: JSON.stringify({ vehicle }),
    }),
    decodeVehicleVin(vehicle?.vin),
  ]);

  const external = externalResult.status === 'fulfilled' ? externalResult.value : null;
  const vin = vinResult.status === 'fulfilled' ? vinResult.value : null;

  return {
    weather: external?.weather || null,
    airQuality: external?.airQuality || null,
    electricRate: external?.electricRate || null,
    vin,
    generatedAt: new Date().toISOString(),
    errors: [
      externalResult.status === 'rejected' ? `External context: ${externalResult.reason.message}` : null,
      ...(external?.errors || []),
      vinResult.status === 'rejected' ? `VIN: ${vinResult.reason.message}` : null,
    ].filter(Boolean),
  };
}

export function buildOwnerRecommendations({ vehicle, weather, airQuality, electricRate, vin }) {
  const recommendations = [];
  const battery = Number(vehicle?.battery);
  const rainProbability = Number(weather?.precipitationProbabilityMax8h || weather?.precipitationProbability || 0);
  const windSpeed = Number(weather?.windSpeedMax12h || weather?.windSpeed || 0);
  const aqi = Number(airQuality?.usAqi || 0);
  const rate = Number(electricRate?.energyRate);

  if (Number.isFinite(battery) && battery < 40) {
    recommendations.push({
      tone: 'amber',
      title: 'Dynamic Charging Advisor',
      detail: `${Math.round(battery)}% battery leaves less margin. ${Number.isFinite(rate) ? `Estimated local energy is $${rate.toFixed(3)}/kWh, so schedule enough charge without overfilling before idle periods.` : 'Use local rate context plus demand windows before charging.'}`,
    });
  }

  if (Number.isFinite(rate)) {
    recommendations.push({
      tone: 'emerald',
      title: 'Electric rate context ready',
      detail: `${electricRate.utility || 'Local utility'} rate context is available at about $${rate.toFixed(3)}/kWh. Use this to compare charging now vs. later.`,
    });
  }

  if (rainProbability >= 45 || Number(weather?.precipitation || 0) > 0) {
    recommendations.push({
      tone: 'sky',
      title: 'Weather may affect scheduling',
      detail: `${Math.round(rainProbability)}% rain probability near the vehicle. Add traffic buffer and move cleaning earlier if a renter pickup is close.`,
    });
  }

  if (windSpeed >= 25) {
    recommendations.push({
      tone: 'amber',
      title: 'Wind may reduce efficiency',
      detail: `${Math.round(windSpeed)} mph winds can reduce range and make highway rentals less efficient.`,
    });
  }

  if (aqi >= 80) {
    recommendations.push({
      tone: 'rose',
      title: 'Air quality is worth flagging',
      detail: `AQI is ${Math.round(aqi)} near the vehicle. Good context for sensitive renters.`,
    });
  }

  if (vin?.modelYear && vin?.model && vin.errorCode === '0') {
    recommendations.push({
      tone: 'emerald',
      title: 'VIN enrichment is ready',
      detail: `${vin.modelYear} ${vin.make} ${vin.model} can be used to reduce manual asset entry.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      tone: 'emerald',
      title: 'No owner action needed right now',
      detail: 'Weather, air quality, battery, and VIN context look normal from the free data sources.',
    });
  }

  return recommendations;
}
