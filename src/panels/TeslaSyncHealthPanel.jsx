import { useEffect, useMemo, useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import { canUseTeslaTelemetry } from '../services/betaCompliance';
import { disconnectTeslaForUser, getFleetOsSession } from '../services/sessionService';
import { getTeslaLoginUrl, getTeslaSyncHealth } from '../services/teslaHealthService';

function healthTone(status) {
  if (status === true) return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
  if (status === false) return 'border-rose-400/25 bg-rose-400/10 text-rose-200';
  return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
}

function statusLabel(status) {
  if (status === true) return 'Healthy';
  if (status === false) return 'Needs Fix';
  return 'Unknown';
}

function CheckCard({ label, detail, status }) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-100">{label}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${healthTone(status)}`}>
          {statusLabel(status)}
        </span>
      </div>
    </article>
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
    setIsLoadingHealth(true);
    try {
      await disconnectTeslaForUser();
      await refreshHealth();
    } catch (error) {
      setHealthError(error.message || 'Tesla disconnect failed.');
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
    const refresh = () => setComplianceRevision((current) => current + 1);
    window.addEventListener('fleetos-compliance-updated', refresh);
    return () => window.removeEventListener('fleetos-compliance-updated', refresh);
  }, []);

  const checks = useMemo(() => {
    const hasLocation = Number.isFinite(Number(vehicle?.latitude)) && Number.isFinite(Number(vehicle?.longitude));
    const hasGpsTimestamp = Boolean(vehicle?.gpsAsOf);
    const syncHealthy = realSyncStatus?.state === 'success';

    return [
      {
        label: 'Backend Reachable',
        detail: health?.backend?.ok ? `Runtime: ${health.backend.runtime || 'api'}` : healthError || 'FleetOS has not reached the backend diagnostics endpoint.',
        status: health ? Boolean(health.backend?.ok) : null,
      },
      {
        label: 'Tesla Credentials',
        detail: health?.credentials?.ok
          ? `Connected for this FleetOS user${health.credentials.connectedAt ? ` since ${formatTime(health.credentials.connectedAt)}` : ''}.`
          : 'Connect Tesla for this FleetOS user. Tokens are stored per user in Postgres.',
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
        label: 'FleetOS User Session',
        detail: session?.user?.id ? `Session ${String(session.sessionId || '').slice(0, 18)}...` : 'FleetOS session has not been created.',
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
    <section className="mb-6 rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10 sm:mb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Tesla Sync Health
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Integration Trust Check
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            A readable checklist for credentials, refresh token status, vehicle access, and precise GPS telemetry.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <span className={`rounded-md border px-3 py-2 text-xs font-black uppercase ${healthTone(overallHealthy)}`}>
            {overallHealthy ? 'Ready' : 'Review Needed'}
          </span>
          <button
            type="button"
            onClick={refreshHealth}
            disabled={isLoadingHealth}
            className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingHealth ? 'Checking...' : 'Recheck Health'}
          </button>
          {consentReady && (
            <button
              type="button"
              onClick={syncAndRecheck}
              disabled={isLoading}
              className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? 'Syncing...' : 'Sync Telemetry'}
            </button>
          )}
          {consentReady && teslaLoginUrl && (
            <a
              href={teslaLoginUrl}
              className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
            >
              {session?.teslaConnected ? 'Reconnect Tesla' : 'Connect Tesla'}
            </a>
          )}
          {session?.teslaConnected && (
            <button
              type="button"
              onClick={disconnectTesla}
              disabled={isLoadingHealth}
              className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-wait disabled:opacity-60"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {!consentReady && (
        <div className="mt-5">
          <BetaConsentPanel compact />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <CheckCard key={check.label} {...check} />
        ))}
      </div>
      <span className="hidden">{complianceRevision}</span>
    </section>
  );
}
