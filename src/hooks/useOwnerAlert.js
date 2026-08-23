import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  dismissOwnerAlert,
  getActiveOwnerAlert,
  getOwnerAlertPrefs,
  notificationPermission,
  registerOwnerAlertWorker,
  requestOwnerAlertPermission,
  setOwnerAlertEnabled,
  showLocalOwnerNotification,
  subscribeOwnerAlertPush,
} from '../services/ownerAlertService';
import {
  isOwnerAlertCooldownActive,
  pickPrimaryOwnerAlert,
} from '../utils/evaluateOwnerAlert';

const LOCAL_SENT_KEY = 'fleetos_owner_alert_local_sent';

function readLocalSent() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SENT_KEY) || '{}');
  } catch {
    return {};
  }
}

function markLocalSent(alert) {
  try {
    const current = readLocalSent();
    current[`${alert.vin}:${alert.trigger}`] = new Date().toISOString();
    localStorage.setItem(LOCAL_SENT_KEY, JSON.stringify(current));
  } catch {
    // ignore quota / private mode
  }
}

function localCooldownActive(alert) {
  const sent = readLocalSent()[`${alert.vin}:${alert.trigger}`];
  return isOwnerAlertCooldownActive(sent);
}

export default function useOwnerAlert({ realFleet = [], teslaConnected = false } = {}) {
  const [enabled, setEnabled] = useState(false);
  const [stored, setStored] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState(null);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [permission, setPermission] = useState(() => notificationPermission());
  const [serverAlert, setServerAlert] = useState(null);
  const [dismissedKey, setDismissedKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const liveAlert = useMemo(
    () => (teslaConnected ? pickPrimaryOwnerAlert(realFleet) : null),
    [realFleet, teslaConnected],
  );

  const alert = useMemo(() => {
    const next = liveAlert || serverAlert;
    if (!next || !enabled) return null;
    if (dismissedKey === `${next.vin}:${next.trigger}`) return null;
    return next;
  }, [liveAlert, serverAlert, enabled, dismissedKey]);

  useEffect(() => {
    registerOwnerAlertWorker();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getOwnerAlertPrefs().catch(() => null),
      getActiveOwnerAlert().catch(() => null),
    ]).then(([prefs, active]) => {
      if (cancelled) return;
      const granted = notificationPermission() === 'granted';
      const nextEnabled = prefs?.stored ? Boolean(prefs.enabled) : Boolean(prefs?.enabled || granted);
      setEnabled(nextEnabled);
      setStored(Boolean(prefs?.stored));
      setVapidPublicKey(prefs?.vapidPublicKey || active?.vapidPublicKey || null);
      setPushConfigured(Boolean(prefs?.pushConfigured || active?.pushConfigured));
      setServerAlert(active?.alert || null);
      setPermission(notificationPermission());
    });
    return () => {
      cancelled = true;
    };
  }, [realFleet.length, teslaConnected]);

  useEffect(() => {
    if (!alert || !enabled || permission !== 'granted' || localCooldownActive(alert)) return;
    showLocalOwnerNotification(alert);
    markLocalSent(alert);
  }, [alert, enabled, permission]);

  const enableAlerts = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await registerOwnerAlertWorker();
      const nextPermission = await requestOwnerAlertPermission();
      setPermission(nextPermission);
      if (nextPermission !== 'granted') {
        setEnabled(false);
        setError('Allow notifications on this device so the alert can reach you when the phone is locked.');
        return false;
      }
      const prefs = await setOwnerAlertEnabled(true);
      setEnabled(true);
      setStored(true);
      setVapidPublicKey(prefs.vapidPublicKey || vapidPublicKey);
      setPushConfigured(Boolean(prefs.pushConfigured));
      if (prefs.vapidPublicKey) {
        await subscribeOwnerAlertPush(prefs.vapidPublicKey);
      }
      return true;
    } catch (nextError) {
      setError(nextError.message || 'Unable to turn owner alerts on.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [vapidPublicKey]);

  const disableAlerts = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await setOwnerAlertEnabled(false);
      setEnabled(false);
      setStored(true);
      return true;
    } catch (nextError) {
      setError(nextError.message || 'Unable to turn owner alerts off.');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const dismiss = useCallback(async (nextAlert = alert) => {
    if (!nextAlert) return;
    setDismissedKey(`${nextAlert.vin}:${nextAlert.trigger}`);
    markLocalSent(nextAlert);
    await dismissOwnerAlert(nextAlert).catch(() => {});
  }, [alert]);

  return {
    alert,
    enabled,
    stored,
    permission,
    pushConfigured,
    busy,
    error,
    enableAlerts,
    disableAlerts,
    dismiss,
  };
}
