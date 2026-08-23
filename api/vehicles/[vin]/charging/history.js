import { getSession, getTeslaScopeStatusForSession, teslaRequestForSession } from '../../../_lib/auth.js';
import { MISSING_CHARGING_SCOPE_MESSAGE, isMissingChargingScopeError } from '../../../_lib/teslaScopes.js';

const DEFAULT_FLEET_API_BASE = process.env.TESLA_API_BASE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  return [];
}

function firstNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function normalizeSession(session, fallbackVin) {
  const fees = Array.isArray(session?.fees) ? session.fees : [];
  const feeTotal = fees.reduce((sum, fee) => sum + (firstNumber(fee?.feeTotal, fee?.totalDue, fee?.feeUntaxed, fee?.amount) || 0), 0);
  const billedAmount = feeTotal > 0
    ? feeTotal
    : firstNumber(session?.feeTotal, session?.totalDue, session?.cost, session?.billedAmount, session?.chargeCost);

  return {
    id: firstString(session?.sessionId, session?.chargeSessionId, session?.id, `${fallbackVin}-${session?.chargeStartDateTime || 'session'}`),
    vin: firstString(session?.vin, fallbackVin),
    startedAt: firstString(session?.chargeStartDateTime, session?.startDateTime, session?.startedAt),
    endedAt: firstString(session?.chargeStopDateTime, session?.endDateTime, session?.endedAt),
    energyKwh: firstNumber(session?.energyAdded, session?.energy_added, session?.kwh, session?.energyAddedKwh),
    billedAmount: Number.isFinite(billedAmount) ? billedAmount : null,
    currency: firstString(fees[0]?.currencyCode, session?.currencyCode, 'USD'),
    locationName: firstString(session?.siteLocationName, session?.chargingSiteName, session?.locationName),
    latitude: firstNumber(session?.chargingLocation?.latitude, session?.location?.latitude, session?.latitude),
    longitude: firstNumber(session?.chargingLocation?.longitude, session?.location?.longitude, session?.longitude),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const vin = req.query?.vin;
  if (!vin) {
    res.status(400).json({ error: 'TESLA_VEHICLE_MISSING', message: 'A Tesla VIN is required.' });
    return;
  }

  try {
    const session = await getSession(req, res, { create: false });
    if (!session) {
      res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Sign in before reading charge history.' });
      return;
    }

    const scopes = await getTeslaScopeStatusForSession(req, res);
    if (scopes.connected && !scopes.hasChargingCmds) {
      res.status(403).json({
        error: 'MISSING_CHARGING_SCOPE',
        message: MISSING_CHARGING_SCOPE_MESSAGE,
        hasChargingCmds: false,
      });
      return;
    }

    const startTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const payload = await teslaRequestForSession(req, res, '/api/1/dx/charging/history', {
      baseURL: DEFAULT_FLEET_API_BASE,
      params: {
        vin,
        startTime,
        pageNo: 1,
        pageSize: 12,
      },
    });

    res.status(200).json({
      sessions: extractRows(payload).map((row) => normalizeSession(row, vin)),
      hasChargingCmds: true,
    });
  } catch (error) {
    if (isMissingChargingScopeError(error)) {
      res.status(403).json({
        error: 'MISSING_CHARGING_SCOPE',
        message: MISSING_CHARGING_SCOPE_MESSAGE,
        hasChargingCmds: false,
      });
      return;
    }

    res.status(error.status || 502).json({
      error: error.status === 401 ? 'TESLA_LOGIN_REQUIRED' : 'TESLA_CHARGE_HISTORY_UNAVAILABLE',
      message: error.message,
    });
  }
}
