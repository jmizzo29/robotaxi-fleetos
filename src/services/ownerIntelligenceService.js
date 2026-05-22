import { hasCoordinates } from './locationIntelligence';

function normalizeVin(vin) {
  return String(vin || '').trim().toUpperCase();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}

export async function getWeatherContext(vehicle) {
  if (!hasCoordinates(vehicle)) return null;

  const latitude = Number(vehicle.latitude).toFixed(5);
  const longitude = Number(vehicle.longitude).toFixed(5);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  const data = await fetchJson(url);

  return {
    temperature: data.current?.temperature_2m,
    precipitation: data.current?.precipitation,
    windSpeed: data.current?.wind_speed_10m,
    humidity: data.current?.relative_humidity_2m,
    precipitationProbability: Math.max(...(data.hourly?.precipitation_probability || [0]).slice(0, 8)),
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
  const [weatherResult, airResult, vinResult] = await Promise.allSettled([
    getWeatherContext(vehicle),
    getAirQualityContext(vehicle),
    decodeVehicleVin(vehicle?.vin),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const airQuality = airResult.status === 'fulfilled' ? airResult.value : null;
  const vin = vinResult.status === 'fulfilled' ? vinResult.value : null;

  return {
    weather,
    airQuality,
    vin,
    generatedAt: new Date().toISOString(),
    errors: [
      weatherResult.status === 'rejected' ? `Weather: ${weatherResult.reason.message}` : null,
      airResult.status === 'rejected' ? `Air quality: ${airResult.reason.message}` : null,
      vinResult.status === 'rejected' ? `VIN: ${vinResult.reason.message}` : null,
    ].filter(Boolean),
  };
}

export function buildOwnerRecommendations({ vehicle, weather, airQuality, vin }) {
  const recommendations = [];
  const battery = Number(vehicle?.battery);
  const rainProbability = Number(weather?.precipitationProbability || 0);
  const windSpeed = Number(weather?.windSpeed || 0);
  const aqi = Number(airQuality?.usAqi || 0);

  if (Number.isFinite(battery) && battery < 40) {
    recommendations.push({
      tone: 'amber',
      title: 'Charge before the next rental handoff',
      detail: `${Math.round(battery)}% battery leaves less margin for renters, errands, or detours.`,
    });
  }

  if (rainProbability >= 45 || Number(weather?.precipitation || 0) > 0) {
    recommendations.push({
      tone: 'sky',
      title: 'Weather may affect pickup quality',
      detail: `${Math.round(rainProbability)}% rain probability near the vehicle. Consider covered pickup instructions.`,
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
