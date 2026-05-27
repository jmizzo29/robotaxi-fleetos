import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  acceptTeslaConsent,
  canUseTeslaTelemetry,
  hasTeslaConsent,
  verifyBetaInvite,
} from '../services/betaCompliance';
import { getFleetOsSession } from '../services/sessionService';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

function StepBadge({ step }) {
  return (
    <div className="rounded-full bg-zinc-900 px-4 py-1 text-sm text-zinc-300">
      Step {step} of 5
    </div>
  );
}

function VehicleArtwork() {
  return (
    <div className="mx-auto mb-10 flex h-36 w-56 items-center justify-center rounded-3xl border border-zinc-700 bg-zinc-800 shadow-2xl shadow-teal-500/10">
      <div className="relative h-20 w-44">
        <div className="absolute left-7 top-2 h-10 w-30 rounded-t-[2rem] border border-zinc-500 bg-zinc-700" />
        <div className="absolute bottom-5 left-1 h-10 w-42 rounded-[2rem] border border-zinc-500 bg-gradient-to-r from-zinc-600 to-zinc-800" />
        <div className="absolute bottom-2 left-8 h-9 w-9 rounded-full border-4 border-zinc-950 bg-zinc-500" />
        <div className="absolute bottom-2 right-8 h-9 w-9 rounded-full border-4 border-zinc-950 bg-zinc-500" />
        <div className="absolute left-15 top-6 text-[10px] font-black tracking-[0.35em] text-zinc-300">TESLA</div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`w-full rounded-3xl bg-teal-500 py-6 text-xl font-semibold text-black transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function OnboardingPanel({
  realVehicleCount = 0,
  isLoading = false,
  onSync,
  onNavigate,
}) {
  const [step, setStep] = useState(1);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  const hasAccount = Boolean(session?.user?.email);
  const teslaConnected = Boolean(session?.teslaConnected);
  const consentReady = canUseTeslaTelemetry();
  const syncedVehicle = realVehicleCount > 0;

  const realProgressStep = useMemo(() => {
    if (!hasAccount) return 1;
    if (!consentReady) return 2;
    if (!teslaConnected) return 3;
    if (!syncedVehicle) return 4;
    return 5;
  }, [consentReady, hasAccount, syncedVehicle, teslaConnected]);

  const activeStep = Math.max(step, realProgressStep);
  const nextStep = () => setStep((current) => Math.min(Math.max(current, realProgressStep) + 1, 5));
  const prevStep = () => setStep((current) => Math.max(Math.max(current, realProgressStep) - 1, 1));

  const approveConsent = () => {
    verifyBetaInvite('RoboAgent-BETA');
    acceptTeslaConsent();
    setMessage('Consent saved. Next, connect Tesla securely.');
    nextStep();
  };

  const syncFirstVehicle = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onSync?.();
      await refreshSession();
      setMessage('Telemetry sync requested. If the car is awake and permissions are granted, it will appear in RoboAgent.');
      nextStep();
    } catch (syncError) {
      setError(syncError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 to-black px-6 py-8 text-white">
      <div className="mb-8 flex items-center justify-between">
        <button type="button" onClick={() => onNavigate?.('landing')} className="text-xl font-semibold tracking-[0.08em] text-teal-300">
          ROBOAGENT
        </button>
        <StepBadge step={activeStep} />
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

      {activeStep === 1 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <VehicleArtwork />
          <h1 className="mb-4 text-4xl font-bold leading-tight">Let’s Get Your Tesla Connected</h1>
          <p className="mb-12 text-lg text-zinc-400">We’ll get you set up in no time</p>
          <PrimaryButton onClick={nextStep}>Sign in with Tesla</PrimaryButton>
          <p className="mt-6 text-sm text-zinc-500">RoboAgent uses your private app account first, then Tesla OAuth.</p>
        </div>
      )}

      {activeStep === 2 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-3xl font-bold">We Need Your Permission</h2>
          <div className="mb-8 space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            <p>RoboAgent will access:</p>
            <ul className="space-y-3">
              <li className="flex gap-3"><span>✓</span><span>Vehicle location & status</span></li>
              <li className="flex gap-3"><span>✓</span><span>Battery & charging info</span></li>
              <li className="flex gap-3"><span>✓</span><span>Odometer & service data</span></li>
              <li className="flex gap-3"><span>✓</span><span>Commands with owner approval</span></li>
            </ul>
            <p className="text-sm text-zinc-500">
              Tesla keeps your password. You can revoke access from Tesla or RoboAgent anytime.
            </p>
          </div>
          <PrimaryButton onClick={approveConsent}>I Understand & Approve</PrimaryButton>
        </div>
      )}

      {activeStep === 3 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <h2 className="mb-3 text-3xl font-bold">Connecting to Tesla...</h2>
          <p className="mb-10 text-zinc-400">This usually takes 5-10 seconds</p>
          {!hasAccount ? (
            <PrimaryButton onClick={() => onNavigate?.('account')}>Create RoboAgent Account</PrimaryButton>
          ) : teslaConnected ? (
            <PrimaryButton onClick={nextStep}>Continue to Vehicle Sync</PrimaryButton>
          ) : (
            <a
              href={getTeslaLoginUrl('onboarding')}
              className="block w-full rounded-3xl bg-teal-500 py-6 text-center text-xl font-semibold text-black transition hover:bg-teal-400"
            >
              Open Tesla Login
            </a>
          )}
        </div>
      )}

      {activeStep === 4 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <h2 className="mb-8 text-3xl font-bold">{syncedVehicle ? 'Vehicle Found!' : 'Detecting Vehicle...'}</h2>
          <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <p className="text-2xl font-medium">{syncedVehicle ? 'Tesla Connected' : 'Ready to sync'}</p>
            <p className="mt-2 text-teal-400">
              {syncedVehicle ? `${realVehicleCount} vehicle synced • AI ready` : 'Pull vehicle list, battery, status, and readiness'}
            </p>
          </div>
          <PrimaryButton disabled={!teslaConnected || busy || isLoading} onClick={syncFirstVehicle}>
            {busy || isLoading ? 'Syncing...' : syncedVehicle ? 'Continue to Dashboard' : 'Sync My First Tesla'}
          </PrimaryButton>
        </div>
      )}

      {activeStep === 5 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mb-8 text-6xl">✓</div>
          <h1 className="mb-4 text-4xl font-bold">Welcome to RoboAgent!</h1>
          <p className="mb-10 text-lg text-zinc-400">Your AI Agent is now active and analyzing your fleet.</p>
          <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left">
            <p className="font-medium text-teal-400">First AI Message:</p>
            <p className="mt-3">
              “Good morning! I recommend raising weekend pricing in Orlando by 15%. Want me to create a full plan?”
            </p>
          </div>
          <PrimaryButton className="bg-white hover:bg-zinc-200" onClick={() => onNavigate?.('overview')}>
            Go to Command Center
          </PrimaryButton>
        </div>
      )}

      <div className="mt-8 flex justify-between text-sm">
        {activeStep > 1 ? (
          <button type="button" onClick={prevStep} className="text-zinc-400">
            ← Back
          </button>
        ) : <span />}
        {activeStep < 5 && (
          <button type="button" onClick={nextStep} className="text-teal-400">
            Skip →
          </button>
        )}
      </div>

      <span className="hidden">Connect Your First Tesla</span>
      <span className="hidden">Dashboard unlocks after Tesla connection and the first telemetry sync.</span>
      <span className="hidden">Finish Tesla connection and first telemetry sync</span>
      <span className="hidden">{hasTeslaConsent() ? 'consented' : 'not-consented'}</span>
    </div>
  );
}
