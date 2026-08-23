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

function billedAmount(session) {
  const fees = Array.isArray(session?.fees) ? session.fees : [];
  const feeTotal = fees.reduce((sum, fee) => {
    const amount = firstNumber(fee?.feeTotal, fee?.totalDue, fee?.feeUntaxed, fee?.amount);
    return sum + (amount || 0);
  }, 0);
  if (feeTotal > 0) {
    return {
      amount: feeTotal,
      currency: firstString(fees[0]?.currencyCode, fees[0]?.currency, session?.currencyCode, 'USD'),
    };
  }

  const amount = firstNumber(
    session?.feeTotal,
    session?.totalDue,
    session?.cost,
    session?.billedAmount,
    session?.chargeCost,
  );
  if (!Number.isFinite(amount)) return null;
  return {
    amount,
    currency: firstString(session?.currencyCode, session?.currency, 'USD'),
  };
}

function sessionLocation(session) {
  const lat = firstNumber(
    session?.chargingLocation?.latitude,
    session?.location?.latitude,
    session?.latitude,
  );
  const lng = firstNumber(
    session?.chargingLocation?.longitude,
    session?.location?.longitude,
    session?.longitude,
  );
  return {
    name: firstString(
      session?.siteLocationName,
      session?.chargingSiteName,
      session?.locationName,
      session?.chargerName,
    ),
    latitude: lat,
    longitude: lng,
  };
}

export function extractChargeHistoryRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  return [];
}

export function normalizeChargeSession(session, fallbackVin = null) {
  if (!session || typeof session !== 'object') return null;
  const energyKwh = firstNumber(
    session.energyAdded,
    session.energy_added,
    session.kwh,
    session.energyAddedKwh,
    session.chargeEnergyAdded,
  );
  const billed = billedAmount(session);
  const location = sessionLocation(session);
  const startedAt = firstString(
    session.chargeStartDateTime,
    session.startDateTime,
    session.startedAt,
    session.chargeStartTime,
  );
  const endedAt = firstString(
    session.chargeStopDateTime,
    session.endDateTime,
    session.endedAt,
    session.chargeStopTime,
  );

  return {
    id: firstString(session.sessionId, session.chargeSessionId, session.id, `${fallbackVin || 'session'}-${startedAt || endedAt || 'unknown'}`),
    vin: firstString(session.vin, fallbackVin),
    startedAt,
    endedAt,
    energyKwh,
    billedAmount: billed?.amount ?? null,
    currency: billed?.currency || null,
    locationName: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function normalizeChargeHistory(payload, fallbackVin = null) {
  return extractChargeHistoryRows(payload)
    .map((row) => normalizeChargeSession(row, fallbackVin))
    .filter(Boolean);
}

export function formatChargeEnergy(kwh) {
  if (!Number.isFinite(Number(kwh))) return '—';
  return `${Number(kwh).toFixed(1)} kWh`;
}

export function formatBilledAmount(amount, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

export function formatChargeTime(value) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
