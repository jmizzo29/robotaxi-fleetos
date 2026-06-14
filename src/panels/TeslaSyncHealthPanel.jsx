import { useEffect, useMemo, useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import TeslaIndependenceNotice from '../components/TeslaIndependenceNotice';
import { AppCard } from '../components/shell';
import { canUseTeslaTelemetry } from '../services/betaCompliance';
import { disconnectTeslaForUser, getFleetOsSession } from '../services/sessionService';
import { logTeslaDisconnect } from '../services/teslaDisconnectUtils';
import { getTeslaLoginUrl, getTeslaSyncHealth } from '../services/teslaHealthService';
import { colors, semantic, typography } from '../design/roboagentTokens';

function healthTone(status) {
  if (status === true) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === false) return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function statusLabel(status) {
  if (status === true) return 'Healthy';
  if (status === false) return 'Needs Fix';
  return 'Unknown';
}

function CheckCard({ label, detail, status }) {
  return (
    <AppCard variant="subdued">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`${typography.bodyMd}`}>{label}</p>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${healthTone(status)}`}>
          {statusLabel(status)}
        </span>
      </div>
    </AppCard>
  );
}

function formatTime(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString();
}

function formatGpsTime(value) {
  if (!value) return 'Unavailable';
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return formatTime(numeric > 1000000000000 ? numeric : numeric * 1000);
  }
  return formatTime(value);
}

export default function TeslaSyncHealthPanel({
  vehicle,
  realSyncStatus,
  isLoading,
  onSync,
}) {
  const [health, setHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);
  const [session, setSession] = useState(null);
  const [complianceRevision, setComplianceRevision] = useState(0);
  const [disconnectState, setDisconnectState] = useState('idle');
  const [disconnectMessage, setDisconnectMessage] = useState('');
  const teslaLoginUrl = getTeslaLoginUrl();
  const consentReady = canUseTeslaTelemetry();

  const refreshHealth = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const [nextSession, nextHealth] = await Promise.all([
        getFleetOsSession(),
        getTeslaSyncHealth(),
      ]);
      setSession(nextSession);
      setHealth(nextHealth);
    } catch (error) {
      setHealthError(error.message || 'Tesla health check failed.');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const disconnectTesla = async () => {
    logTeslaDisconnect('click', { surface: 'tesla-sync-health' });
    setDisconnectState('disconnecting');
    setDisconnectMessage('');
    setHealthError(null);
    setIsLoadingHealth(true);

    try {
      const result = await disconnectTeslaForUser();
      setSession((current) => (
        current ? { ...current, teslaConnected: false, teslaConnectedAt: null } : current
      ));
      setDisconnectState('disconnected');
      setDisconnectMessage(result.message || 'Connection removed.');
      logTeslaDisconnect('ui_success', {
        hadActiveConnection: result.hadActiveConnection,
        surface: 'tesla-sync-health',
      });
      await refreshHealth();
    } catch (error) {
      setDisconnectState('failed');
      setHealthError(error.message || 'Unable to remove the Tesla connection. Try again.');
      logTeslaDisconnect('ui_failure', {
        surface: 'tesla-sync-health',
        message: error.message,
      });
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const syncAndRecheck = async () => {
    await onSync?.();
    window.setTimeout(() => {
      refreshHealth();
    }, 700);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshHealth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (session?.teslaConnected) {
      setDisconnectState('idle');
      setDisconnectMessage('');
    }
  }, [session?.teslaConnected]);

  useEffect(() => {
    const refresh = () => setComplianceRevision((current) => current + 1);
    window.addEventListener('fleetos-compliance-updated', refresh);
    return () => window.removeEventListener('fleetos-compliance-updated', refresh);
  }, []);

  const showConnected = Boolean(session?.teslaConnected) && disconnectState !== 'disconnected';
  const isDisconnecting = disconnectState === 'disconnecting';

  const checks = useMemo(() => {
    const hasLocation = Number.isFinite(Number(vehicle?.latitude)) && Number.isFinite(Number(vehicle?.longitude));
    const hasGpsTimestamp = Boolean(vehicle?.gpsAsOf);
    const syncHealthy = realSyncStatus?.state === 'success';

    return [
      {
        label: 'Backend Reachable',
        detail: health?.backend?.ok ? `Runtime: ${health.backend.runtime || 'api'}` : healthError || 'ROBOAGENT has not reached the backend diagnostics endpoint.',
        status: health ? Boolean(health.backend?.ok) : null,
      },
      {
        label: 'Tesla Credentials',
        detail: health?.credentials?.ok
          ? `Connected for this ROBOAGENT user${health.credentials.connectedAt ? ` since ${formatTime(health.credentials.connectedAt)}` : ''}.`
          : 'Connect Tesla for this ROBOAGENT user. Tokens are stored per user in Postgres.',
        status: health ? Boolean(health.credentials?.ok) : null,
      },
      {
        label: 'Refresh Token',
        detail: health?.token?.message || (health?.token?.ok ? 'Tesla accepted this user connection.' : 'Run the Tesla login flow for this user.'),
        status: health?.token?.ok,
      },
      {
        label: 'Vehicle Access',
        detail: health?.vehicles?.ok
          ? `${health.vehicles.count || 0} vehicle${health.vehicles.count === 1 ? '' : 's'} returned, ${health.vehicles.onlineCount || 0} online.`
          : health?.vehicles?.message || 'Vehicle list has not been confirmed yet.',
        status: health?.vehicles?.ok,
      },
      {
        label: 'Location Scope',
        detail: hasLocation
          ? `${Number(vehicle.latitude).toFixed(5)}, ${Number(vehicle.longitude).toFixed(5)}`
          : 'Vehicle Location scope/data sharing has not produced GPS coordinates yet.',
        status: hasLocation,
      },
      {
        label: 'Live GPS Timestamp',
        detail: hasGpsTimestamp ? `GPS as of ${formatGpsTime(vehicle.gpsAsOf)}` : 'Tesla did not return a GPS timestamp on the latest sync.',
        status: hasGpsTimestamp,
      },
      {
        label: 'Latest Sync',
        detail: realSyncStatus?.message || 'No sync status available.',
        status: syncHealthy,
      },
      {
        label: 'ROBOAGENT User Session',
        detail: session?.user?.id ? `Session ${String(session.sessionId || '').slice(0, 18)}...` : 'ROBOAGENT session has not been created.',
        status: Boolean(session?.user?.id),
      },
      {
        label: 'Partner Domain',
        detail: health?.partnerDomain || 'Only required for production command/signing flows.',
        status: health?.partnerDomain ? true : null,
      },
    ];
  }, [health, healthError, realSyncStatus, session, vehicle]);

  const overallHealthy = checks.filter((check) => check.status === false).length === 0 && checks.some((check) => check.status === true);

  return (
    <AppCard className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={typography.label}>Tesla Sync Health</p>
          <h2 className={`mt-2 ${typography.cardTitle}`}>
            Integration Trust Check
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
            A readable checklist for credentials, refresh token status, vehicle access, and precise GPS telemetry.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <span className={`rounded-2xl border px-3 py-2 text-xs font-bold uppercase ${healthTone(overallHealthy)}`}>
            {overallHealthy ? 'Ready' : 'Review Needed'}
          </span>
          <button
            type="button"
            onClick={refreshHealth}
            disabled={isLoadingHealth}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingHealth ? 'Checking…' : 'Recheck Health'}
          </button>
          {consentReady && (
            <button
              type="button"
              onClick={syncAndRecheck}
              disabled={isLoading}
              className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {isLoading ? 'Syncing…' : 'Sync Telemetry'}
            </button>
          )}
          {consentReady && teslaLoginUrl && (
            <a
              href={teslaLoginUrl}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              {showConnected ? 'Reconnect Tesla' : 'Connect Tesla'}
            </a>
          )}
          {showConnected && (
            <button
              type="button"
              onClick={disconnectTesla}
              disabled={isLoadingHealth || isDisconnecting}
              aria-busy={isDisconnecting}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
            >
              {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {(disconnectMessage || disconnectState === 'failed') && (
        <p
          role={disconnectState === 'failed' ? 'alert' : 'status'}
          className="mt-4 text-sm font-semibold"
          style={{ color: disconnectState === 'failed' ? semantic.alert : semantic.positive }}
        >
          {disconnectState === 'failed' ? healthError : disconnectMessage}
        </p>
      )}

      {!consentReady && (
        <div className="mt-5">
          <BetaConsentPanel compact />
        </div>
      )}

      <div className="mt-5">
        <TeslaIndependenceNotice />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <CheckCard key={check.label} {...check} />
        ))}
      </div>
      <span className="hidden">{complianceRevision}</span>
    </AppCard>
  );
}
