import {
  evaluateOwnerAlert,
  isOwnerAlertCooldownActive,
  ownerAlertNotificationUrl,
} from '../../src/utils/evaluateOwnerAlert.js';
import { ensureFleetSchema, hasPostgres, query } from './db.js';

export function vapidPublicKey() {
  return String(process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '').trim();
}

export function vapidPrivateKey() {
  return String(process.env.VAPID_PRIVATE_KEY || '').trim();
}

export function isWebPushConfigured() {
  return Boolean(vapidPublicKey() && vapidPrivateKey());
}

function mapStoredVehicle(row = {}) {
  const raw = row.raw && typeof row.raw === 'object' ? row.raw : {};
  return {
    vin: row.vin,
    display_name: row.display_name || raw.display_name || raw.name,
    name: raw.name,
    state: row.state || raw.state,
    battery: row.battery_level ?? raw.battery,
    battery_level: row.battery_level,
    chargingState: row.charging_state || raw.chargingState,
    charging_state: row.charging_state,
    chargeLimit: raw.chargeLimit || raw.charge_state?.charge_limit_soc,
    last_synced_at: row.last_synced_at || raw.syncedAt,
    previousChargingState: row.previous_charging_state,
    raw,
  };
}

export async function getOwnerAlertPref(userId) {
  if (!hasPostgres() || !userId) return null;
  await ensureFleetSchema();
  const { rows } = await query(
    'select enabled, updated_at from fleetos_owner_alert_prefs where user_id = $1',
    [userId],
  );
  return rows[0] || null;
}

export async function setOwnerAlertPref(userId, enabled) {
  await ensureFleetSchema();
  const { rows } = await query(
    `insert into fleetos_owner_alert_prefs (user_id, enabled, updated_at)
     values ($1, $2, now())
     on conflict (user_id) do update set enabled = excluded.enabled, updated_at = now()
     returning enabled, updated_at`,
    [userId, Boolean(enabled)],
  );
  return rows[0];
}

export async function listPushSubscriptions(userId) {
  if (!hasPostgres() || !userId) return [];
  await ensureFleetSchema();
  const { rows } = await query(
    'select endpoint, p256dh, auth from fleetos_push_subscriptions where user_id = $1',
    [userId],
  );
  return rows;
}

export async function savePushSubscription(userId, subscription = {}) {
  const endpoint = String(subscription.endpoint || '').trim();
  const p256dh = String(subscription.keys?.p256dh || subscription.p256dh || '').trim();
  const auth = String(subscription.keys?.auth || subscription.auth || '').trim();
  if (!endpoint || !p256dh || !auth) {
    const error = new Error('A Web Push subscription endpoint and keys are required.');
    error.status = 400;
    error.code = 'PUSH_SUBSCRIPTION_INVALID';
    throw error;
  }
  await ensureFleetSchema();
  await query(
    `insert into fleetos_push_subscriptions (endpoint, user_id, p256dh, auth, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())
     on conflict (endpoint) do update set
       user_id = excluded.user_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       updated_at = now()`,
    [endpoint, userId, p256dh, auth],
  );
  return { endpoint };
}

export async function deletePushSubscription(userId, endpoint) {
  await ensureFleetSchema();
  await query(
    'delete from fleetos_push_subscriptions where user_id = $1 and endpoint = $2',
    [userId, String(endpoint || '').trim()],
  );
}

async function lastSend(userId, vin, trigger) {
  const { rows } = await query(
    'select last_sent_at from fleetos_owner_alert_sends where user_id = $1 and vin = $2 and trigger = $3',
    [userId, vin, trigger],
  );
  return rows[0]?.last_sent_at || null;
}

export async function recordOwnerAlertSend(userId, alert, now = new Date()) {
  await ensureFleetSchema();
  await query(
    `insert into fleetos_owner_alert_sends (user_id, vin, trigger, last_sent_at, last_payload)
     values ($1, $2, $3, $4, $5::jsonb)
     on conflict (user_id, vin, trigger) do update set
       last_sent_at = excluded.last_sent_at,
       last_payload = excluded.last_payload`,
    [userId, alert.vin, alert.trigger, now.toISOString(), JSON.stringify(alert)],
  );
}

async function previousChargingState(vin) {
  if (!vin) return null;
  const { rows } = await query(
    `select charging_state
     from fleetos_telemetry_snapshots
     where vin = $1
     order by captured_at desc
     offset 1
     limit 1`,
    [vin],
  );
  return rows[0]?.charging_state || null;
}

export async function loadStoredFleetVehicles(fleetId) {
  if (!hasPostgres() || !fleetId) return [];
  await ensureFleetSchema();
  const { rows } = await query(
    `select vin, display_name, state, battery_level, charging_state, last_synced_at, raw
     from fleetos_vehicles
     where fleet_id = $1 and vin is not null
     order by last_synced_at desc nulls last`,
    [fleetId],
  );
  return Promise.all(rows.map(async (row) => mapStoredVehicle({
    ...row,
    previous_charging_state: await previousChargingState(row.vin),
  })));
}

export async function alertsEnabledForUser(userId) {
  const pref = await getOwnerAlertPref(userId);
  if (pref) return Boolean(pref.enabled);
  const subscriptions = await listPushSubscriptions(userId);
  return subscriptions.length > 0;
}

async function sendWebPush(subscription, payload) {
  if (!isWebPushConfigured()) {
    return { sent: false, reason: 'vapid_not_configured' };
  }
  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT || 'mailto:ops@autofleeto.com',
    vapidPublicKey(),
    vapidPrivateKey(),
  );
  try {
    await webpush.sendNotification({
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }, JSON.stringify(payload));
    return { sent: true };
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await query('delete from fleetos_push_subscriptions where endpoint = $1', [subscription.endpoint]).catch(() => {});
    }
    return { sent: false, reason: error.message || 'push_failed' };
  }
}

export function buildPushPayload(alert) {
  return {
    title: alert.title,
    body: alert.body,
    url: ownerAlertNotificationUrl(),
    vin: alert.vin,
    trigger: alert.trigger,
    tag: `${alert.vin}-${alert.trigger}`,
  };
}

export async function evaluateStoredOwnerAlert(userId, fleetId, { recordDismiss = false } = {}) {
  const vehicles = await loadStoredFleetVehicles(fleetId);
  const now = new Date();
  for (const vehicle of vehicles) {
    const alert = evaluateOwnerAlert(vehicle, now);
    if (!alert) continue;
    const sentAt = await lastSend(userId, alert.vin, alert.trigger);
    if (isOwnerAlertCooldownActive(sentAt, now)) continue;
    if (recordDismiss) {
      await recordOwnerAlertSend(userId, alert, now);
    }
    return { alert, vehicles };
  }
  return { alert: null, vehicles };
}

export async function notifyOwnerAlertsForUser(userId, fleetId, { vehicles = null } = {}) {
  if (!hasPostgres() || !userId || !fleetId) {
    return { sent: 0, skipped: 'unavailable' };
  }

  const enabled = await alertsEnabledForUser(userId);
  if (!enabled) return { sent: 0, skipped: 'disabled' };

  const list = vehicles || await loadStoredFleetVehicles(fleetId);
  const subscriptions = await listPushSubscriptions(userId);
  const now = new Date();
  let sent = 0;
  const results = [];

  for (const vehicle of list) {
    const mapped = vehicle.vin && vehicle.battery == null && vehicle.battery_level == null
      ? mapStoredVehicle(vehicle)
      : {
        ...vehicle,
        previousChargingState: vehicle.previousChargingState || await previousChargingState(vehicle.vin),
      };
    const alert = evaluateOwnerAlert(mapped, now);
    if (!alert) continue;

    const sentAt = await lastSend(userId, alert.vin, alert.trigger);
    if (isOwnerAlertCooldownActive(sentAt, now)) {
      results.push({ vin: alert.vin, trigger: alert.trigger, skipped: 'cooldown' });
      continue;
    }

    if (subscriptions.length === 0) {
      results.push({ vin: alert.vin, trigger: alert.trigger, skipped: 'no_subscription' });
      continue;
    }

    const payload = buildPushPayload(alert);
    let delivered = false;
    for (const subscription of subscriptions) {
      const result = await sendWebPush(subscription, payload);
      if (result.sent) delivered = true;
    }

    if (delivered) {
      await recordOwnerAlertSend(userId, alert, now);
      sent += 1;
    }
    results.push({
      vin: alert.vin,
      trigger: alert.trigger,
      delivered,
      pushConfigured: isWebPushConfigured(),
    });
    break;
  }

  return { sent, results, pushConfigured: isWebPushConfigured() };
}

export async function notifyAllEnabledOwnerAlerts() {
  if (!hasPostgres()) return { sent: 0, users: 0 };
  await ensureFleetSchema();
  const { rows } = await query(`
    select distinct fleet.owner_user_id as user_id, fleet.id as fleet_id
    from fleetos_fleets fleet
    left join fleetos_owner_alert_prefs prefs on prefs.user_id = fleet.owner_user_id
    left join fleetos_push_subscriptions push on push.user_id = fleet.owner_user_id
    where fleet.owner_user_id is not null
      and (
        prefs.enabled = true
        or (prefs.user_id is null and push.user_id is not null)
      )
  `);

  let sent = 0;
  for (const row of rows) {
    const result = await notifyOwnerAlertsForUser(row.user_id, row.fleet_id);
    sent += Number(result.sent || 0);
  }
  return { sent, users: rows.length, pushConfigured: isWebPushConfigured() };
}
