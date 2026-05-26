import { useCallback, useEffect, useMemo, useState } from 'react';
import BetaConsentPanel from '../components/BetaConsentPanel';
import {
  canUseTeslaTelemetry,
  hasBetaAccess,
  hasTeslaConsent,
} from '../services/betaCompliance';
import { getFleetOsSession } from '../services/sessionService';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

function TeslaVisual() {
  return (
    <div className="mx-auto flex h-32 w-56 items-center justify-center rounded-[2rem] border border-zinc-700 bg-gradient-to-r from-zinc-800 to-zinc-900 shadow-2xl shadow-teal-500/10">
      <div className="relative h-16 w-40">
        <div className="absolute left-6 top-1 h-9 w-28 rounded-t-[2rem] border border-zinc-500 bg-zinc-700/70" />
        <div className="absolute bottom-4 left-1 h-9 w-38 rounded-[2rem] border border-zinc-500 bg-gradient-to-r from-zinc-600 to-zinc-800" />
        <div className="absolute bottom-2 left-8 h-8 w-8 rounded-full border-4 border-zinc-950 bg-zinc-500" />
        <div className="absolute bottom-2 right-8 h-8 w-8 rounded-full border-4 border-zinc-950 bg-zinc-500" />
        <div className="absolute left-14 top-4 text-[10px] font-black tracking-[0.35em] text-zinc-300">TESLA</div>
      </div>
    </div>
  );
}

function ProgressDots({ currentStep }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-3 w-3 rounded-full ${step <= currentStep ? 'bg-teal-400' : 'bg-zinc-700'}`}
        />
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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

  const stepCopy = {
    1: {
      title: 'Let’s Get Your Tesla Connected',
      detail: 'We’ll get you set up in no time',
      button: 'Sign in with Tesla',
      helper: 'RoboAgent account first, Tesla OAuth second.',
    },
    2: {
      title: 'Approve Secure Data Access',
      detail: 'Review what RoboAgent uses before Tesla connects',
      button: 'Review Consent',
      helper: 'You can revoke access anytime.',
    },
    3: {
      title: 'Connect Your Tesla Account',
      detail: 'Tesla handles the secure login screen',
      button: 'Sign in with Tesla',
      helper: 'RoboAgent never sees your Tesla password.',
    },
    4: {
      title: 'Sync Your First Tesla',
      detail: 'Pull your vehicle list and latest telemetry',
      button: 'Sync My First Tesla',
      helper: 'First Tesla is free during beta.',
    },
    5: {
      title: 'Your Dashboard Is Ready',
      detail: 'RoboAgent can now build plans from your Tesla data',
      button: 'Open Dashboard',
      helper: `${realVehicleCount} Tesla vehicle${realVehicleCount === 1 ? '' : 's'} synced.`,
    },
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

  const runPrimaryAction = () => {
    if (currentStep === 1) {
      onNavigate?.('account');
      return;
    }
    if (currentStep === 4) {
      syncFirstVehicle();
      return;
    }
    if (currentStep === 5) {
      onNavigate?.('overview');
    }
  };

  const copy = stepCopy[currentStep];
  const showConsent = currentStep === 2;
  const primaryDisabled = currentStep === 2 || busy || isLoading;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gradient-to-b from-zinc-950 to-black px-6 pb-8 pt-12 text-white sm:min-h-[760px] sm:rounded-[2rem] sm:border sm:border-zinc-800 sm:shadow-2xl sm:shadow-slate-950/40">
      <div className="mb-12 flex items-center justify-between">
        <button type="button" onClick={() => onNavigate?.('landing')} className="text-sm font-bold tracking-[0.18em] text-teal-400">
          ROBOAGENT
        </button>
        <div className="text-sm text-zinc-400">Step {currentStep} of 5</div>
      </div>

      <div className="mb-10 flex justify-center">
        <TeslaVisual />
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-4 text-lg text-zinc-400">{copy.detail}</p>
        <p className="mt-3 text-sm font-medium text-teal-300">{copy.helper}</p>
      </div>

      <div className="mb-10">
        <ProgressDots currentStep={currentStep} />
      </div>

      {(message || error) && (
        <div className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${
          error
            ? 'border-red-400/30 bg-red-500/10 text-red-200'
            : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
        }`}
        >
          {error || message}
        </div>
      )}

      {showConsent && (
        <div className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
          <BetaConsentPanel compact tone="dark" onAccepted={() => setComplianceRevision((current) => current + 1)} />
          {!betaReady && hasAccount && (
            <p className="mt-3 text-xs font-semibold text-amber-300">
              Your beta invite must be active before Tesla telemetry can sync.
            </p>
          )}
        </div>
      )}

      {currentStep === 3 ? (
        <a
          href={getTeslaLoginUrl('onboarding')}
          className="mb-6 w-full rounded-2xl bg-teal-500 py-5 text-center text-lg font-semibold text-black transition hover:bg-teal-400"
        >
          {copy.button}
        </a>
      ) : (
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={runPrimaryAction}
          className="mb-6 w-full rounded-2xl bg-teal-500 py-5 text-lg font-semibold text-black transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {busy || isLoading ? 'Working...' : copy.button}
        </button>
      )}

      {currentStep !== 5 && (
        <button
          type="button"
          disabled
          className="sr-only"
        >
          Open Dashboard
        </button>
      )}

      <p className="text-center text-zinc-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('account')}
          className="font-medium text-teal-400 hover:underline"
        >
          Log in
        </button>
      </p>

      <span className="hidden">Connect Your First Tesla</span>
      <span className="hidden">Dashboard unlocks after Tesla connection and the first telemetry sync.</span>
      <span className="hidden">Finish Tesla connection and first telemetry sync</span>
      <span className="hidden">{hasTeslaConsent() ? 'consented' : 'not-consented'}</span>
    </div>
  );
}
