import { getCommandAiPlan, getFleetActivityFeed } from './commandHomeUtils';
import { getCommandEarningsHero } from './vehicleDisplayUtils';

const DEFAULT_TIMES = ['08:12', '09:44', '10:18', '10:52', '11:06'];

function parseAmount(amount) {
  if (!amount || amount === '—') return 0;
  const n = Number(String(amount).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
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
export function getMonumentTake(fleet, realFleet, totalEarnings, syncState, city = 'Orlando') {
  const hero = getCommandEarningsHero(fleet, realFleet, totalEarnings, syncState);
  const trips = hero.trips && hero.trips !== '—' ? hero.trips : '0';

  return {
    label: syncState === 'loading' ? 'TODAY' : hero.operational ? 'PROJECTED' : 'TODAY',
    amount: hero.amount,
    subline: syncState === 'loading'
      ? 'syncing Tesla'
      : `${trips} trips · ${city}`,
    projected: Boolean(hero.operational),
    loading: syncState === 'loading',
    margin: hero.netMargin && hero.netMargin !== '—' ? hero.netMargin : null,
  };
}

/** Single action line + confirm payload for Sheet A. */
export function getMonumentAction(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings) {
  const plan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue, totalEarnings);
  const action = plan.action || 'Review fleet status';
  const line = action.endsWith('.') ? action : `${action}.`;

  return {
    line: line.replace(/^Move/i, 'Dispatch').replace(/^Schedule/i, 'Charge'),
    plan,
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

  return { time, cab, event: eventLabel, value, tone: event.impactTone };
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
