import { getCommandAiPlan, getFleetActivityFeed } from './commandHomeUtils';
import { getExpansionRecommendation, getExpansionScoreboard } from './networkIntelligenceUtils';
import {
  getCommandEarningsHero,
  getCommandOperationalSource,
  hasTrustedFleetRevenue,
  vehicleBatteryPercent,
  vehicleStateLabel,
} from './vehicleDisplayUtils';

const DEFAULT_TIMES = ['08:12', '09:44', '10:18', '10:52', '11:06'];

function commandSource(fleet, realFleet, totalEarnings, syncState) {
  return getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
}

function cabLabel(vehicle, index) {
  if (vehicle?.isReal) {
    const name = vehicle.display_name || vehicle.name;
    if (name) return name;
  }
  const id = String(vehicle?.id || vehicle?.name || '');
  const carMatch = id.match(/CAR-(\d+)/i);
  if (carMatch) return `CAB-${carMatch[1].padStart(2, '0')}`;
  const match = id.match(/\d+/);
  if (match) return `CAB-${String(match[0]).padStart(2, '0')}`;
  return `CAB-${String(index + 1).padStart(2, '0')}`;
}

function parseAmount(amount) {
  if (!amount || amount === '—') return 0;
  const n = Number(String(amount).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function assetStatusLine(vehicle) {
  const status = vehicleStateLabel(vehicle);
  const raw = String(vehicle?.status || '').toUpperCase();

  if (status === 'Charging') return 'Charging';
  if (status === 'Offline' || status === 'Asleep') return 'Offline';
  if (raw.includes('MCO') || raw.includes('AIRPORT')) return 'En route → MCO';
  if (raw.includes('PICK') || raw.includes('ROUTE') || raw.includes('SERVICE')) {
    const city = String(vehicle?.city || 'demand zone').split(',')[0].trim();
    return `En route → ${city}`;
  }
  if (status === 'Parked') return 'Parked · ready';
  return 'Online';
}

function assetPositionLabel(vehicle) {
  const lat = Number(vehicle?.latitude);
  const lng = Number(vehicle?.longitude);
  const city = vehicle?.city ? String(vehicle.city).split(',')[0].trim() : null;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return city ? `${city} · live` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  return city || 'Position pending sync';
}

function ownerCityLabel(fleet = []) {
  const city = fleet.find((vehicle) => vehicle.city)?.city;
  return city ? String(city).split(',')[0].trim() : 'Orlando';
}

function actionTitle(action = '') {
  const charge = action.match(/(?:Schedule|Charge|Move)\s+([A-Z]+-?\d+|\S+-?\d+)/i);
  if (charge) {
    const cab = charge[1].replace(/^vehicle\s+/i, '');
    if (/charg/i.test(action)) return `Charge ${cab}`;
    if (/move|dispatch|deploy/i.test(action)) return `Dispatch ${cab}`;
    return `Schedule ${cab}`;
  }
  return action.split('.')[0].slice(0, 48) || 'Confirm action';
}

function actionBody(action = '') {
  if (/charg/i.test(action)) {
    return 'Route to nearest Supercharger. Ready for evening demand window.';
  }
  if (/move|mco|dispatch|deploy/i.test(action)) {
    return 'Stage for high-demand corridor. Estimated uplift from current position.';
  }
  return 'Queue this plan for your fleet.';
}

/** Monument hero block from existing earnings pipeline. */
export function getMonumentTake(fleet, realFleet, totalEarnings, syncState, city) {
  const hero = getCommandEarningsHero(fleet, realFleet, totalEarnings, syncState);
  const cityFromFleet = (realFleet.find((vehicle) => vehicle.city) || fleet.find((vehicle) => vehicle.isReal && vehicle.city))?.city;
  const cityLabel = city || (cityFromFleet ? String(cityFromFleet).split(',')[0].trim() : null);

  if (syncState === 'loading') {
    return {
      label: 'TODAY',
      amount: hero.amount || '—',
      subline: 'syncing Tesla',
      projected: false,
      loading: true,
      margin: null,
    };
  }

  if (hasTrustedFleetRevenue(realFleet, totalEarnings, syncState)) {
    const trips = hero.trips && hero.trips !== '—' ? hero.trips : null;
    const tripPart = trips ? `${trips} trips` : 'trips pending';
    return {
      label: 'TODAY',
      amount: hero.amount,
      subline: cityLabel ? `${tripPart} · ${cityLabel}` : tripPart,
      projected: false,
      loading: false,
      margin: hero.netMargin && hero.netMargin !== '—' ? hero.netMargin : null,
    };
  }

  const connected = realFleet.length > 0 || syncState === 'success';
  return {
    label: 'TODAY',
    amount: '—',
    subline: connected ? 'no trips yet' : 'connect Tesla for live earnings',
    projected: false,
    loading: false,
    margin: null,
  };
}

/** Fleet Status Card â€” command pulse for owners. */
export function getFleetStatusCardPayload({
  fleet = [],
  realFleet = [],
  totalEarnings = 0,
  syncState = 'idle',
  strip = null,
  expansion = null,
} = {}) {
  const source = commandSource(fleet, realFleet, totalEarnings, syncState);
  const hero = getCommandEarningsHero(fleet, realFleet, totalEarnings, syncState);
  const teslaSynced = realFleet.length > 0;
  const active = teslaSynced ? Number(strip?.active?.value) || 0 : 0;
  const charging = teslaSynced ? Number(strip?.charging?.value) || 0 : 0;
  const service = teslaSynced ? Number(strip?.service?.value) || 0 : 0;
  const offline = teslaSynced ? Number(strip?.offline?.value) || 0 : 0;
  const total = teslaSynced ? Number(strip?.total) || source.length : 0;
  const attentionCount = service + offline;
  const hasRevenue = teslaSynced && !hero.operational && hero.amount !== 'â€”' && hero.amount !== '$0';
  const growthCity = expansion?.city || 'Tampa';
  const hasGrowthSignal = total > 0
    && !attentionCount
    && syncState !== 'loading'
    && expansion?.confidenceLabel === 'High'
    && Number(expansion?.projectedDaily) >= 400;

  let state = 'normal';
  if (!teslaSynced) {
    state = 'recommended';
  } else if (syncState === 'error' || attentionCount > 0) {
    state = 'attention';
  } else if (!total || syncState === 'loading' || charging > 0 || active < total) {
    state = 'recommended';
  } else if (hasGrowthSignal) {
    state = 'growth';
  }

  return {
    state,
    headline: {
      normal: 'Fleet Operating Normally',
      recommended: 'Action Recommended',
      attention: 'Fleet Needs Attention',
      growth: 'Growth Opportunity Detected',
    }[state],
    detail: {
      normal: total > 0 ? 'All vehicles are available and telemetry is current.' : 'Connect Tesla to begin fleet monitoring.',
      recommended: syncState === 'loading'
        ? 'Tesla telemetry is syncing now.'
        : teslaSynced
          ? 'A small fleet action can improve readiness.'
          : 'Connect Tesla to activate the fleet pulse.',
      attention: syncState === 'error'
        ? 'Tesla sync needs a retry before the fleet pulse is current.'
        : `${attentionCount} asset${attentionCount === 1 ? '' : 's'} need review.`,
      growth: `${growthCity} demand signal is ready for review.`,
    }[state],
    items: [
      {
        label: 'Operations',
        value: total > 0 ? `${active}/${total}` : '0/0',
        detail: teslaSynced ? 'active now' : 'no Teslas synced',
        tone: active === total && total > 0 ? 'normal' : 'recommended',
      },
      {
        label: 'Revenue',
        value: hasRevenue ? hero.amount : (teslaSynced ? 'Live' : '0'),
        detail: hasRevenue ? 'today' : (teslaSynced ? 'tracking' : 'no revenue yet'),
        tone: hasRevenue ? 'normal' : 'neutral',
      },
      {
        label: 'Protection',
        value: teslaSynced ? (attentionCount > 0 ? String(attentionCount) : 'Clear') : '0',
        detail: teslaSynced
          ? (attentionCount > 0 ? 'needs review' : 'assets protected')
          : 'no assets synced',
        tone: attentionCount > 0 ? 'attention' : 'normal',
      },
      {
        label: 'Growth',
        value: teslaSynced ? growthCity : '0 synced',
        detail: teslaSynced ? (hasGrowthSignal ? 'opportunity' : 'monitoring') : 'not monitoring',
        tone: hasGrowthSignal ? 'growth' : 'neutral',
      },
    ],
  };
}

/** Single action line + confirm payload for Sheet A. */
export function getMonumentAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings) {
  const syncState = realSyncStatus?.state ?? 'idle';
  const plan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings);
  const action = plan.action || 'Review fleet status';
  const line = action.endsWith('.') ? action : `${action}.`;
  const topEarner = getTopEarner(fleet, realFleet, totalEarnings, syncState);

  return {
    line: line.replace(/^Move/i, 'Dispatch').replace(/^Schedule/i, 'Charge'),
    plan,
    secondary: topEarner
      ? { label: `View ${topEarner.cab}`, cab: topEarner.cab }
      : null,
    confirm: {
      title: actionTitle(action),
      body: actionBody(action),
      command: action,
      priority: /charg|offline|critical/i.test(action) ? 'HIGH' : 'NORMAL',
      metrics: [
        { label: 'est. gain', value: plan.expectedRevenueImpact || '+$140 tonight', positive: true },
        { label: 'confidence', value: plan.confidenceLabel || '87%' },
        { label: 'queue', value: String(plan.pendingCount || 0) },
      ],
      primaryLabel: /charg/i.test(action) ? 'Confirm charge plan' : /move|dispatch|mco/i.test(action) ? 'Confirm dispatch' : 'Confirm plan',
    },
  };
}

function feedToLedgerRow(event, index) {
  const cab = event.vehicleName || 'Fleet';
  const time = DEFAULT_TIMES[index % DEFAULT_TIMES.length];
  let eventLabel = event.description || 'activity';
  let value = event.impact || '—';

  if (event.eventType === 'surge') {
    eventLabel = event.impact?.includes('%') ? event.description : 'SURGE';
    value = event.impact?.includes('%') ? event.impact.replace(/.*(\+\d+%).*/, '$1') : event.impact;
  } else if (event.eventType === 'trip') {
    const amt = String(event.impact).match(/\$(\d+)/);
    value = amt ? `+${amt[1]}.00` : '+0.00';
    eventLabel = event.description?.replace(cab, '').trim() || 'trip';
  } else if (event.eventType === 'charging') {
    value = '—';
    eventLabel = 'charging';
  }

  return { time, cab, event: eventLabel, value, tone: event.impactTone, vehicle: event.vehicle };
}

/** Highest revenue vehicle for Sheet B affordance. */
export function getTopEarner(fleet, realFleet, totalEarnings, syncState) {
  const source = commandSource(fleet, realFleet, totalEarnings, syncState);
  if (!source.length) return null;

  let best = source[0];
  let bestIndex = 0;

  source.forEach((vehicle, index) => {
    const revenue = Number(vehicle.revenue) || 0;
    const bestRevenue = Number(best.revenue) || 0;
    if (revenue > bestRevenue || (revenue === bestRevenue && index < bestIndex)) {
      best = vehicle;
      bestIndex = index;
    }
  });

  return {
    vehicle: best,
    index: bestIndex,
    cab: cabLabel(best, bestIndex),
  };
}

function isFleetMemberInService(vehicle) {
  const status = String(vehicle?.status || '').toUpperCase();
  const score = Number(vehicle?.maintenanceScore);
  return status.includes('SERVICE') || status.includes('MAINT')
    || (Number.isFinite(score) && score < 78);
}

function getFleetMemberTile(vehicle) {
  const state = vehicleStateLabel(vehicle);
  if (isFleetMemberInService(vehicle)) return 'down';
  if (state === 'Charging') return 'charging';
  if (state === 'Offline' || state === 'Asleep') return 'down';
  return 'active';
}

/** Fleet tab tile drill-down — members matching Active, Charge, or Down. */
export function getFleetMembersByTile(tileKey, fleet, realFleet, totalEarnings, syncState) {
  const source = commandSource(fleet, realFleet, totalEarnings, syncState);
  return source
    .map((vehicle, index) => ({ vehicle, index, cab: cabLabel(vehicle, index) }))
    .filter((entry) => getFleetMemberTile(entry.vehicle) === tileKey);
}

export function findVehicleByCab(cab, fleet, realFleet, totalEarnings = 0, syncState = 'idle') {
  const source = commandSource(fleet, realFleet, totalEarnings, syncState);
  const match = source.find((vehicle, index) => cabLabel(vehicle, index) === cab);
  if (!match) return null;
  return { vehicle: match, index: source.indexOf(match), cab };
}

function assetLedgerRows(fleet, realFleet, totalEarnings, syncState, cab) {
  const feed = getFleetActivityFeed(fleet, realFleet, 12, totalEarnings, syncState);
  return feed
    .filter((event) => event.vehicleName === cab)
    .slice(0, 4)
    .map(feedToLedgerRow);
}

/** Sheet B — asset detail for a single CAB. */
export function getAssetSheetPayload(
  fleet,
  realFleet,
  totalEarnings,
  syncState,
  target = null,
) {
  const resolved = target?.vehicle
    ? target
    : getTopEarner(fleet, realFleet, totalEarnings, syncState);

  if (!resolved?.vehicle) return null;

  const { vehicle, cab } = resolved;
  const revenue = Math.round(Number(vehicle.revenue) || 0);
  const battery = vehicleBatteryPercent(vehicle);
  const hourly = revenue > 0 ? Math.max(24, Math.round(revenue / 5)) : 0;
  const rows = assetLedgerRows(fleet, realFleet, totalEarnings, syncState, cab);

  return {
    cab,
    vehicle,
    statusLine: assetStatusLine(vehicle),
    revenue: `$${revenue.toLocaleString()}`,
    rows: rows.length
      ? rows
      : [
        { time: '10:18', cab, event: 'trip', value: '+24.00', tone: 'positive' },
        { time: '11:06', cab, event: 'staging', value: '—', tone: 'neutral' },
      ],
    metrics: [
      { label: 'hourly est.', value: hourly ? `$${hourly}/hr` : '—', positive: hourly > 0 },
      { label: 'battery', value: battery !== null ? `${battery}%` : '—' },
    ],
    hasLocation: Number.isFinite(Number(vehicle.latitude)) && Number.isFinite(Number(vehicle.longitude)),
    positionLabel: assetPositionLabel(vehicle),
    latitude: Number(vehicle.latitude),
    longitude: Number(vehicle.longitude),
    nudgeCommand: `Move ${cab} to MCO demand zone`,
  };
}

/** Sheet C — explore expansion market. */
export function getGrowSheetPayload(fleet = [], city = 'Tampa') {
  const expansion = getExpansionRecommendation(fleet);
  const scoreboard = getExpansionScoreboard();
  const market = scoreboard.find((entry) => entry.city === city) || scoreboard[1];
  const compare = scoreboard.find((entry) => entry.city === (city === 'Tampa' ? 'Jacksonville' : 'Tampa'));
  const weekly = Math.round(((expansion.projectedMonthly || 4960) * (market?.score || 88) / 92) / 4);

  const bodyByCity = {
    Tampa: 'Two Orlando cabs are under-utilized Sunday evenings. Tampa demand fills that gap without new hardware.',
    Jacksonville: 'Jacksonville airport volume is rising on weekend arrivals. One cab could test the corridor without fleet changes.',
  };

  return {
    city: market?.city || city,
    weeklyAmount: `+$${weekly.toLocaleString()}`,
    weeklyLabel: 'per week potential',
    body: bodyByCity[market?.city || city] || bodyByCity.Tampa,
    metrics: [
      { label: 'demand gap', value: `+${Math.round((market?.score || 80) / 4)}%`, positive: true },
      { label: 'headroom', value: `${expansion.deployCount || 2} cabs` },
      { label: 'proj. weekly', value: weekly.toFixed(2) },
      { label: 'assumptions', value: 'simulated', projected: true },
    ],
    primaryLabel: `Stage ${market?.city || city} plan`,
    compareCity: compare?.city || 'Tampa',
    command: `Stage ${expansion.deployCount || 2} vehicles for ${market?.city || city} expansion`,
    score: market?.score || 88,
  };
}

/** Sheet D — today detail from hero tap. */
export function getTodayDetailPayload(fleet, realFleet, totalEarnings, syncState, heroAmount) {
  const take = getMonumentTake(fleet, realFleet, totalEarnings, syncState);
  const ledger = getFleetLedger(fleet, realFleet, totalEarnings, syncState, heroAmount);

  return {
    amount: take.amount,
    projected: take.projected,
    ledger,
  };
}

/** Whether Tesla telemetry is actively linked for this session. */
export function isTeslaConnected(realFleet = [], realSyncStatus = null) {
  return realFleet.length > 0 || realSyncStatus?.state === 'success';
}

export const TESLA_DISCONNECT_CONFIRM = {
  title: 'Disconnect Tesla?',
  body: 'ROBOAGENT will stop syncing your fleet. Reconnect anytime from the home screen. For a full revoke, also remove ROBOAGENT from Tesla third-party access in your Tesla app.',
  primaryLabel: 'Disconnect',
};

/** Sheet E — account summary. */
export function getAccountSheetPayload({
  userName = 'ROBOAGENT Owner',
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
}) {
  const syncState = realSyncStatus?.state ?? 'idle';
  const fleetCount = Math.max(fleet.length, realFleet.length);
  const city = ownerCityLabel(fleet);

  let syncLabel = 'Idle';
  if (syncState === 'loading') syncLabel = 'Syncing';
  else if (syncState === 'success') syncLabel = 'Healthy';
  else if (syncState === 'error') syncLabel = 'Needs attention';

  return {
    name: userName,
    subtitle: `${city} · ${fleetCount} Cybercab${fleetCount === 1 ? '' : 's'}`,
    rows: [
      { label: 'Program', value: 'Beta' },
      { label: 'Tesla', value: realFleet.length > 0 ? 'Connected' : 'Not connected' },
      { label: 'Sync', value: syncLabel },
      { label: 'Map', value: '→', route: 'map' },
      { label: 'Network', value: '→', route: 'network' },
      { label: 'Integrations', value: '→', route: 'integrations' },
      { label: 'Settings', value: '→', route: 'settings' },
      { label: 'Feedback', value: '→', action: 'feedback' },
      { label: 'Privacy', value: '→', route: 'privacy' },
    ],
  };
}

/** G6 ledger rows + footer totals. */
export function getFleetLedger(fleet, realFleet, totalEarnings, syncState, heroAmount) {
  const feed = getFleetActivityFeed(fleet, realFleet, 12, totalEarnings, syncState);
  const rows = feed.map(feedToLedgerRow);
  const hero = getCommandEarningsHero(fleet, realFleet, totalEarnings, syncState);
  const total = parseAmount(heroAmount);
  const verifiedRaw = realFleet.reduce((sum, v) => sum + (Number(v.revenue) || 0), 0);

  return {
    dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
    rows,
    footer: {
      total: total.toFixed(2),
      verified: hero.operational ? '0.00' : Math.min(total, verifiedRaw).toFixed(2),
      projected: hero.operational ? total.toFixed(2) : Math.max(0, total - verifiedRaw).toFixed(2),
      margin: hero.netMargin || '—',
    },
  };
}
