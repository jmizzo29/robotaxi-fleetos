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
    <section className={`rounded-3xl border p-4 shadow-sm transition sm:p-5 ${active ? 'active-step' : ''} ${
      complete
        ? 'border-emerald-200 bg-emerald-50'
        : active
          ? 'border-sky-200 bg-white'
          : 'border-slate-200 bg-white/70'
    }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
          complete ? 'bg-emerald-500 text-white' : active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
        }`}
        >
          {complete ? '✓' : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
            <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase ${
              complete
                ? 'border-emerald-200 bg-white text-emerald-700'
                : active
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-500'
            }`}>
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
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
    />
  );
}

function SetupRail({ steps }) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {steps.map((step) => (
        <div
          key={step.number}
          className={`rounded-2xl border p-3 ${
            step.status === 'complete'
              ? 'border-emerald-200 bg-emerald-50'
              : step.status === 'active'
                ? 'border-sky-200 bg-sky-50'
                : 'border-slate-200 bg-white/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${
              step.status === 'complete'
                ? 'bg-emerald-500 text-white'
                : step.status === 'active'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {step.status === 'complete' ? '✓' : step.number}
            </span>
            <span className="text-xs font-black text-slate-800">{step.short}</span>
          </div>
        </div>
      ))}
    </div>
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
  const [savedPlan] = useState(() => {
    if (typeof window === 'undefined') return null;
    const storedPlan = window.localStorage.getItem('fleetos_pending_agent_plan');
    if (!storedPlan) return null;
    try {
      return JSON.parse(storedPlan);
    } catch {
      window.localStorage.removeItem('fleetos_pending_agent_plan');
      return null;
    }
  });
  const [, setComplianceRevision] = useState(0);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await getFleetOsSession();
      setSession(nextSession);
      setError('');
    } catch (sessionError) {
      if (String(sessionError.message || '').toLowerCase().includes('sign in')) {
        setSession({ authenticated: false, user: {} });
        return;
      }
      throw sessionError;
    }
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
      setMessage('Telemetry sync requested. If the car is awake and permissions are granted, it will appear in RoboAgent.');
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

  const setupSteps = [
    { number: '1', short: 'Account', status: statusFor(1) },
    { number: '2', short: 'Consent', status: statusFor(2) },
    { number: '3', short: 'Tesla', status: statusFor(3) },
    { number: '4', short: 'Sync', status: statusFor(4) },
    { number: '5', short: 'Dashboard', status: statusFor(5) },
  ];

  const stepDetails = {
    1: {
      title: isClerkConfigured() ? 'Create your secure RoboAgent account' : 'Create your RoboAgent account',
      detail: isClerkConfigured()
        ? 'Use secure hosted sign-in so Tesla access is tied to your private owner account.'
        : 'Use the beta invite code so RoboAgent can attach telemetry and billing status to the right person.',
    },
    2: {
      title: 'Approve telemetry consent',
      detail: 'Review the data RoboAgent uses for maps, health, finance, charging, and AI recommendations.',
    },
    3: {
      title: 'Connect Tesla',
      detail: 'Tesla opens its secure login. RoboAgent never sees your Tesla password.',
    },
    4: {
      title: 'Sync your first vehicle',
      detail: 'Pull your Tesla list and latest live data. First Tesla is free during beta.',
    },
    5: {
      title: 'Open your owner dashboard',
      detail: 'See live telemetry, health, earnings, charging, map, and AI brief in one place.',
    },
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">Fast Setup</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Connect Your First Tesla</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">One account, one consent, one Tesla sync. Then RoboAgent opens your owner dashboard.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Current Step</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{currentStep} of 5</p>
          </div>
        </div>
        <div className="mt-5">
          <SetupRail steps={setupSteps} />
        </div>
      </section>

      <section className="rounded-3xl border border-sky-200 bg-white p-5 shadow-lg shadow-slate-200/60 md:hidden">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Do This Now</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{stepDetails[currentStep].title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{stepDetails[currentStep].detail}</p>
        {!syncedVehicle && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
            Dashboard unlocks after Tesla connection and the first telemetry sync.
          </p>
        )}
        <button
          type="button"
          disabled={!syncedVehicle}
          onClick={() => onNavigate?.('overview')}
          className="mt-3 w-full rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          Open Dashboard
        </button>
      </section>

      {(message || error) && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold ${
          error
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
        >
          {error || message}
        </div>
      )}

      {savedPlan && (
        <article className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Saved AI Plan</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{savedPlan.response?.title || 'Fleet plan saved'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Goal: <span className="font-bold text-slate-950">{savedPlan.goal}</span>
          </p>
          {savedPlan.response?.impact && (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-white p-3 text-sm font-bold text-emerald-800">
              Expected impact: {savedPlan.response.impact}
            </p>
          )}
        </article>
      )}

      {!hasAccount && (
        <div className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Start Here</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Sign in to RoboAgent before connecting Tesla</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Tesla access is attached to your private RoboAgent account. Sign in first, then connect Tesla securely.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('account')}
            className="mt-5 w-full rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 sm:w-auto"
          >
            Sign In / Create Account
          </button>
        </div>
      )}

      <div className="space-y-4 max-md:[&>section:not(.active-step)]:hidden">
      <StepShell
        number="1"
        title={isClerkConfigured() ? 'Create your secure RoboAgent account' : 'Create your RoboAgent account'}
        detail={isClerkConfigured()
          ? 'Use Clerk-hosted signup or sign-in. RoboAgent maps that verified identity to your private fleet records.'
          : 'Use the beta invite code so RoboAgent can attach telemetry and billing status to the right person.'}
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
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
            >
              Create Free Account
            </button>
          </div>
        ) : (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Signed in as {session.user.email}. First Tesla free is active for this account.
          </p>
        )}
      </StepShell>

      <StepShell
        number="2"
        title="Approve beta telemetry consent"
        detail="RoboAgent uses VIN, battery, odometer, charging state, vehicle state, and precise location to power the dashboard."
        status={statusFor(2)}
      >
        {consentReady ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Consent accepted on this device.
          </p>
        ) : (
          <BetaConsentPanel compact tone="light" onAccepted={() => setComplianceRevision((current) => current + 1)} />
        )}
        {!betaReady && hasAccount && (
          <p className="mt-3 text-xs font-semibold text-amber-700">
            Use the same invite code from account creation to unlock beta consent on this device.
          </p>
        )}
      </StepShell>

      <StepShell
        number="3"
        title="Connect Tesla"
        detail="Tesla OAuth opens in the browser. RoboAgent never asks for your Tesla password."
        status={statusFor(3)}
      >
        {teslaConnected ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Tesla is connected for this RoboAgent account.
          </p>
        ) : (
          <a
            href={getTeslaLoginUrl('onboarding')}
            className={`block rounded-xl px-5 py-3 text-center text-sm font-black transition ${
              consentReady
                ? 'border border-emerald-200 bg-emerald-500 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600'
                : 'pointer-events-none border border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            Connect Tesla Account
          </a>
        )}
      </StepShell>

      <StepShell
        number="4"
        title="Run first telemetry sync"
        detail="RoboAgent pulls your Tesla list and live data. Your first Tesla is included free during beta."
        status={statusFor(4)}
      >
        {syncedVehicle ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {realVehicleCount} live Tesla vehicle{realVehicleCount === 1 ? '' : 's'} synced.
          </p>
        ) : (
          <button
            type="button"
            disabled={!teslaConnected || !consentReady || isLoading || busy}
            onClick={syncFirstVehicle}
            className="w-full rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            {isLoading || busy ? 'Syncing...' : 'Sync My First Tesla'}
          </button>
        )}
      </StepShell>

      <StepShell
        number="5"
        title="Open the dashboard"
        detail="Once synced, RoboAgent can show the map, finance, health, charging, alerts, and owner intelligence views."
        status={statusFor(5)}
      >
        {!syncedVehicle && (
          <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Finish Tesla connection and first telemetry sync before opening the RoboAgent dashboard.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!syncedVehicle}
            onClick={() => onNavigate?.('overview')}
            className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            Open Dashboard
          </button>
          <button
            type="button"
            disabled={!syncedVehicle}
            onClick={() => onNavigate?.('map')}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400"
          >
            View Live Map
          </button>
        </div>
      </StepShell>

      </div>

      <span className="hidden">{hasTeslaConsent() ? 'consented' : 'not-consented'}</span>
    </div>
  );
}
