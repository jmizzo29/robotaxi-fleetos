import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClerkOnboardingAuthStep } from '../auth/ClerkAccountControls';
import { isClerkConfigured } from '../auth/clerkConfig';
import BetaConsentPanel from '../components/BetaConsentPanel';
import {
  canUseTeslaTelemetry,
  hasBetaAccess,
  hasTeslaConsent,
  verifyBetaInvite,
} from '../services/betaCompliance';
import {
  getFleetOsSession,
  registerFleetOsAccount,
} from '../services/sessionService';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

function StepShell({ number, title, detail, status, children }) {
  const complete = status === 'complete';
  const active = status === 'active';

  return (
    <section className={`rounded-lg border p-5 ${
      complete
        ? 'border-emerald-400/20 bg-emerald-400/10'
        : active
          ? 'border-sky-400/30 bg-sky-400/10'
          : 'border-white/10 bg-slate-900/70'
    }`}
    >
      <div className="flex items-start gap-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-black ${
          complete ? 'bg-emerald-300 text-slate-950' : active ? 'bg-sky-300 text-slate-950' : 'bg-white/10 text-slate-300'
        }`}
        >
          {complete ? 'OK' : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-black uppercase text-slate-300">
              {complete ? 'Complete' : active ? 'Current' : 'Next'}
            </span>
          </div>
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
    />
  );
}

export default function OnboardingPanel({
  realVehicleCount = 0,
  isLoading = false,
  onSync,
  onNavigate,
}) {
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    inviteCode: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [, setComplianceRevision] = useState(0);

  const refreshSession = useCallback(async () => {
    const nextSession = await getFleetOsSession();
    setSession(nextSession);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshSession().catch((refreshError) => setError(refreshError.message));
    }, 0);
    const refreshCompliance = () => setComplianceRevision((current) => current + 1);
    window.addEventListener('fleetos-compliance-updated', refreshCompliance);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('fleetos-compliance-updated', refreshCompliance);
    };
  }, [refreshSession]);

  const hasAccount = Boolean(session?.user?.email);
  const consentReady = canUseTeslaTelemetry();
  const betaReady = hasBetaAccess();
  const teslaConnected = Boolean(session?.teslaConnected);
  const syncedVehicle = realVehicleCount > 0;

  const currentStep = useMemo(() => {
    if (!hasAccount) return 1;
    if (!consentReady) return 2;
    if (!teslaConnected) return 3;
    if (!syncedVehicle) return 4;
    return 5;
  }, [consentReady, hasAccount, syncedVehicle, teslaConnected]);

  const createAccount = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await registerFleetOsAccount(form);
      verifyBetaInvite(form.inviteCode);
      await refreshSession();
      setMessage('Account created. Next, approve the Tesla telemetry consent.');
    } catch (accountError) {
      setError(accountError.message);
    } finally {
      setBusy(false);
    }
  };

  const syncFirstVehicle = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onSync?.();
      await refreshSession();
      setMessage('Telemetry sync requested. If the car is awake and permissions are granted, it will appear in FleetOS.');
    } catch (syncError) {
      setError(syncError.message);
    } finally {
      setBusy(false);
    }
  };

  const statusFor = (step) => {
    if (currentStep > step) return 'complete';
    if (currentStep === step) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-5">
      {(message || error) && (
        <div className={`rounded-lg border p-4 text-sm font-semibold ${
          error
            ? 'border-red-400/25 bg-red-400/10 text-red-100'
            : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
        }`}
        >
          {error || message}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">Tesla Owner Setup</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Get from signup to first live Tesla sync</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          This is the clean beta path for a mobile Tesla owner: create a FleetOS account, approve data use, connect Tesla, sync once, then land on the operating dashboard.
        </p>
      </div>

      <StepShell
        number="1"
        title={isClerkConfigured() ? 'Create your secure FleetOS account' : 'Create your FleetOS account'}
        detail={isClerkConfigured()
          ? 'Use Clerk-hosted signup or sign-in. FleetOS maps that verified identity to your private fleet records.'
          : 'Use the beta invite code so FleetOS can attach telemetry and billing status to the right person.'}
        status={statusFor(1)}
      >
        {isClerkConfigured() ? (
          <ClerkOnboardingAuthStep onAuthChange={refreshSession} />
        ) : !hasAccount ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Name"
            />
            <TextInput
              value={form.inviteCode}
              onChange={(event) => setForm({ ...form, inviteCode: event.target.value })}
              placeholder="Beta invite code"
            />
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Email"
            />
            <TextInput
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Password, 8+ characters"
            />
            <button
              type="button"
              disabled={busy}
              onClick={createAccount}
              className="rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
            >
              Create Free Account
            </button>
          </div>
        ) : (
          <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
            Signed in as {session.user.email}. First Tesla free is active for this account.
          </p>
        )}
      </StepShell>

      <StepShell
        number="2"
        title="Approve beta telemetry consent"
        detail="FleetOS uses VIN, battery, odometer, charging state, vehicle state, and precise location to power the dashboard."
        status={statusFor(2)}
      >
        {consentReady ? (
          <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
            Consent accepted on this device.
          </p>
        ) : (
          <BetaConsentPanel compact onAccepted={() => setComplianceRevision((current) => current + 1)} />
        )}
        {!betaReady && hasAccount && (
          <p className="mt-3 text-xs font-semibold text-amber-200">
            Use the same invite code from account creation to unlock beta consent on this device.
          </p>
        )}
      </StepShell>

      <StepShell
        number="3"
        title="Connect Tesla"
        detail="Tesla OAuth opens in the browser. FleetOS never asks for your Tesla password."
        status={statusFor(3)}
      >
        {teslaConnected ? (
          <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
            Tesla is connected for this FleetOS account.
          </p>
        ) : (
          <a
            href={getTeslaLoginUrl('onboarding')}
            className={`block rounded-lg px-5 py-3 text-center text-sm font-black transition ${
              consentReady
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20'
                : 'pointer-events-none border border-white/10 bg-white/5 text-slate-500'
            }`}
          >
            Connect Tesla Account
          </a>
        )}
      </StepShell>

      <StepShell
        number="4"
        title="Run first telemetry sync"
        detail="FleetOS pulls your Tesla list and live data. Your first Tesla is included free during beta."
        status={statusFor(4)}
      >
        {syncedVehicle ? (
          <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
            {realVehicleCount} live Tesla vehicle{realVehicleCount === 1 ? '' : 's'} synced.
          </p>
        ) : (
          <button
            type="button"
            disabled={!teslaConnected || !consentReady || isLoading || busy}
            onClick={syncFirstVehicle}
            className="w-full rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:pointer-events-none disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            {isLoading || busy ? 'Syncing...' : 'Sync My First Tesla'}
          </button>
        )}
      </StepShell>

      <StepShell
        number="5"
        title="Open the dashboard"
        detail="Once synced, FleetOS can show the map, finance, health, charging, alerts, and owner intelligence views."
        status={statusFor(5)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate?.('overview')}
            className="rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200"
          >
            Open Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('map')}
            className="rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15"
          >
            View Live Map
          </button>
        </div>
      </StepShell>

      <span className="hidden">{hasTeslaConsent() ? 'consented' : 'not-consented'}</span>
    </div>
  );
}
