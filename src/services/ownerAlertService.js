import { fetchApiJson } from './apiClient';

export async function getOwnerAlertPrefs() {
  return fetchApiJson('/owner-alerts/prefs');
}

export async function setOwnerAlertEnabled(enabled) {
  return fetchApiJson('/owner-alerts/prefs', {
    method: 'PATCH',
    body: JSON.stringify({ enabled: Boolean(enabled) }),
  });
}

export async function getActiveOwnerAlert() {
  return fetchApiJson('/owner-alerts/active');
}

export async function dismissOwnerAlert({ vin, trigger }) {
  return fetchApiJson('/owner-alerts/dismiss', {
    method: 'POST',
    body: JSON.stringify({ vin, trigger }),
  });
}

export async function saveOwnerAlertSubscription(subscription) {
  const json = subscription?.toJSON ? subscription.toJSON() : subscription;
  return fetchApiJson('/owner-alerts/subscribe', {
    method: 'POST',
    body: JSON.stringify(json),
  });
}

export async function deleteOwnerAlertSubscription(endpoint) {
  return fetchApiJson('/owner-alerts/subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerOwnerAlertWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function subscribeOwnerAlertPush(vapidKey) {
  if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await saveOwnerAlertSubscription(existing);
    return existing;
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  await saveOwnerAlertSubscription(subscription);
  return subscription;
}

export function notificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestOwnerAlertPermission() {
  if (typeof Notification === 'undefined' || !Notification.requestPermission) {
    return 'unsupported';
  }
  return Notification.requestPermission();
}

export function showLocalOwnerNotification(alert) {
  if (!alert || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const registration = navigator.serviceWorker?.controller;
    if (registration) {
      // System tray via SW when available; tap only opens Command.
      navigator.serviceWorker.ready.then((ready) => {
        ready.showNotification(alert.title, {
          body: alert.body,
          tag: `${alert.vin}-${alert.trigger}`,
          data: { url: '/#/overview', vin: alert.vin, trigger: alert.trigger },
        });
      }).catch(() => {
        new Notification(alert.title, { body: alert.body, tag: `${alert.vin}-${alert.trigger}` });
      });
      return true;
    }
    new Notification(alert.title, { body: alert.body, tag: `${alert.vin}-${alert.trigger}` });
    return true;
  } catch {
    return false;
  }
}
