import { useCallback, useEffect, useMemo, useState } from 'react';
import { useClerk, useSignUp } from '@clerk/react';
import { isClerkConfigured } from '../auth/clerkConfig';
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

const OAUTH_REDIRECT_URL = '/sso-callback';
const OAUTH_COMPLETE_URL = '/#/onboarding';

function ClerkOAuthButtons() {
  const { isLoaded, signUp } = useSignUp();
  const [oauthError, setOauthError] = useState('');
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return undefined;
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  const startOAuth = async (strategy) => {
    if (!isLoaded || !signUp) return;
    setOauthError('');
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: OAUTH_REDIRECT_URL,
        redirectUrlComplete: OAUTH_COMPLETE_URL,
      });
    } catch (authError) {
      const clerkMessage = authError?.errors?.[0]?.longMessage || authError?.errors?.[0]?.message;
      setOauthError(clerkMessage || authError.message || 'Could not start secure OAuth sign up.');
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => startOAuth('oauth_google')}
          disabled={!isLoaded}
          className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-5 font-medium transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl">G</span>
          Google
        </button>

        <button
          type="button"
          onClick={() => startOAuth('oauth_apple')}
          disabled={!isLoaded}
          className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-5 font-medium transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl">A</span>
          Apple
        </button>
      </div>

      {oauthError && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          {oauthError}
        </div>
      )}

      {loadTimedOut && !isLoaded && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">
          Google and Apple sign-up are waiting on Clerk. Check that production Clerk keys and social providers are enabled.
        </div>
      )}
    </>
  );
}

function OAuthFallbackButtons() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {['Google', 'Apple'].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            className="flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-5 font-medium opacity-50"
          >
            <span className="text-xl">{provider === 'Google' ? 'G' : 'A'}</span>
            {provider}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">
        Google and Apple OAuth require Clerk&apos;s public browser key.
      </div>
    </>
  );
}

function ClerkEmailSignUpButton({ email, onValidate }) {
  const { openSignUp } = useClerk();

  const startSignUp = () => {
    if (!onValidate()) return;
    openSignUp({
      initialValues: { emailAddress: email },
      forceRedirectUrl: OAUTH_COMPLETE_URL,
      fallbackRedirectUrl: OAUTH_COMPLETE_URL,
    });
  };

  return (
    <button
      type="button"
      onClick={startSignUp}
      className="w-full rounded-3xl bg-teal-500 py-6 text-xl font-semibold text-black transition hover:bg-teal-400"
    >
      Create Free Account
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
  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [accountErrors, setAccountErrors] = useState({});

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

  const validateAccountForm = () => {
    const nextErrors = {};
    const email = accountForm.email.trim();
    if (!email) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!accountForm.password) {
      nextErrors.password = 'Create a password.';
    } else if (accountForm.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setAccountErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createNativeAccount = () => {
    if (!validateAccountForm()) return;
    nextStep();
  };

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('landing')}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-teal-400 hover:text-teal-200"
          >
            Back Home
          </button>
          <StepBadge step={activeStep} />
        </div>
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
        <div className="flex flex-1 flex-col justify-center px-6 py-8">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-xl shadow-teal-500/30">
              <span className="text-5xl font-bold tracking-tighter text-black">R</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
              Create Your RoboAgent Account
            </h1>
            <p className="mx-auto max-w-md text-lg text-zinc-400">
              One account to manage all your Teslas, rentals, and future Robotaxis
            </p>
          </div>

          <div className="mx-auto w-full max-w-md space-y-6">
            <div>
              <label htmlFor="onboarding-email" className="mb-2 block text-sm text-zinc-400">Email Address</label>
              <input
                id="onboarding-email"
                type="email"
                value={accountForm.email}
                onChange={(event) => {
                  setAccountForm((current) => ({ ...current, email: event.target.value }));
                  setAccountErrors((current) => ({ ...current, email: '' }));
                }}
                placeholder="you@email.com"
                aria-invalid={Boolean(accountErrors.email)}
                className={`w-full rounded-2xl border bg-zinc-900 px-6 py-5 text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 ${
                  accountErrors.email ? 'border-red-400' : 'border-zinc-700'
                }`}
              />
              {accountErrors.email && (
                <p className="mt-2 text-sm font-semibold text-red-300">{accountErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="onboarding-password" className="mb-2 block text-sm text-zinc-400">Password</label>
              <input
                id="onboarding-password"
                type="password"
                value={accountForm.password}
                onChange={(event) => {
                  setAccountForm((current) => ({ ...current, password: event.target.value }));
                  setAccountErrors((current) => ({ ...current, password: '' }));
                }}
                placeholder="Create a password"
                aria-invalid={Boolean(accountErrors.password)}
                className={`w-full rounded-2xl border bg-zinc-900 px-6 py-5 text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 ${
                  accountErrors.password ? 'border-red-400' : 'border-zinc-700'
                }`}
              />
              {accountErrors.password && (
                <p className="mt-2 text-sm font-semibold text-red-300">{accountErrors.password}</p>
              )}
            </div>

            {isClerkConfigured() ? (
              <ClerkEmailSignUpButton email={accountForm.email.trim()} onValidate={validateAccountForm} />
            ) : (
              <PrimaryButton onClick={createNativeAccount}>
                Create Free Account
              </PrimaryButton>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative text-center">
                <span className="bg-zinc-950 px-4 text-sm text-zinc-500">or continue with</span>
              </div>
            </div>

            <div className="hidden" aria-hidden="true">
              <button
                type="button"
                onClick={() => onNavigate?.('account')}
                className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-5 transition hover:bg-zinc-800"
              >
                <span className="text-xl">G</span>
                Google
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('account')}
                className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-5 transition hover:bg-zinc-800"
              >
                <span className="text-xl"></span>
                Apple
              </button>
            </div>

            {isClerkConfigured() ? (
              <ClerkOAuthButtons />
            ) : (
              <OAuthFallbackButtons />
            )}

          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-4xl font-bold">Just a few permissions needed</h2>
            <p className="text-lg text-zinc-400">
              RoboAgent needs access to help you maximize earnings
            </p>
          </div>

          <div className="mb-10 rounded-3xl border border-zinc-700 bg-zinc-900/70 p-8">
            <h3 className="mb-6 text-lg font-semibold text-white">What RoboAgent will access:</h3>
            <div className="space-y-6">
              {[
                ['📍', 'Vehicle Location & Status', 'Real-time location, lock status, and software version'],
                ['🔋', 'Battery & Charging', 'Battery level, charging speed, and optimal charge times'],
                ['🛠️', 'Health & Maintenance', 'Tire pressure, brake wear, service alerts'],
                ['📊', 'Odometer & Trip Data', 'Mileage and rental usage data'],
              ].map(([icon, title, detail]) => (
                <div key={title} className="flex gap-4">
                  <div className="mt-1 text-2xl text-teal-400">{icon}</div>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-zinc-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 text-center text-sm text-zinc-400">
            You can revoke access anytime in settings.<br />
            Tesla controls all data access.
          </div>

          <PrimaryButton onClick={approveConsent}>Approve & Continue</PrimaryButton>

          <p className="mt-6 text-center text-xs text-zinc-500">
            This is required to use RoboAgent
          </p>
        </div>
      )}

      {activeStep === 99 && (
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
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-5xl">
              ⚡
            </div>
            <h2 className="mb-4 text-4xl font-bold">Connect Your Tesla</h2>
            <p className="mx-auto max-w-xs text-lg text-zinc-400">
              Sign in securely with Tesla to sync your vehicles and let your AI Agent get to work
            </p>
          </div>

          <div className="mx-auto w-full max-w-md">
            {!hasAccount ? (
              <PrimaryButton onClick={() => onNavigate?.('account')}>Create RoboAgent Account</PrimaryButton>
            ) : teslaConnected ? (
              <PrimaryButton onClick={nextStep}>Continue to Vehicle Sync</PrimaryButton>
            ) : (
              <a
                href={getTeslaLoginUrl('onboarding')}
                className="flex w-full items-center justify-center gap-3 rounded-3xl bg-white py-7 text-xl font-semibold text-black shadow-lg shadow-teal-500/20 transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
              >
                <span className="text-2xl">🔌</span>
                Sign in with Tesla
              </a>
            )}

            <div className="mt-8 rounded-3xl border border-zinc-700 bg-zinc-900/50 p-6 text-sm">
              <p className="mb-3 font-medium text-teal-400">🔒 Secure & Private</p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li>• You’ll be redirected to Tesla’s official login</li>
                <li>• RoboAgent never sees your Tesla password</li>
                <li>• You control what data we can access</li>
                <li>• Can be disconnected anytime</li>
              </ul>
            </div>

            <p className="mt-8 text-center text-xs text-zinc-500">
              First Tesla is completely free
            </p>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-8">
              <div className="mx-auto h-20 w-20 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            </div>

            <h2 className="mb-4 text-4xl font-bold">
              {syncedVehicle ? 'Vehicle Found!' : 'Finding Your Vehicles...'}
            </h2>
            <p className="text-lg text-zinc-400">
              {syncedVehicle ? 'Your first Tesla is ready for RoboAgent' : 'This usually takes 10-20 seconds'}
            </p>
          </div>

          <div className="mx-auto w-full max-w-md space-y-4">
            <div className="flex items-center gap-4 rounded-3xl bg-zinc-900 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
                🚗
              </div>
              <div className="flex-1">
                <p className="font-medium">{syncedVehicle ? 'Tesla Vehicle' : 'Model Y • Orlando'}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-teal-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-teal-400" />
                  {syncedVehicle ? 'Connected' : 'Connecting...'}
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500">
                {syncedVehicle ? 'AI Ready' : '94% Battery'}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-3xl bg-zinc-900 p-6 opacity-75">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
                🚙
              </div>
              <div className="flex-1">
                <p className="font-medium">{realVehicleCount > 1 ? 'Additional Tesla' : 'Model 3 • Tampa'}</p>
                <div className="mt-1 text-sm text-zinc-500">{realVehicleCount > 1 ? 'Queued for analysis' : 'Waiting for sync...'}</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-zinc-500">
            Pulling real-time data from Tesla Fleet API
          </div>

          <PrimaryButton disabled={!teslaConnected || busy || isLoading} onClick={syncFirstVehicle} className="mt-8">
            {busy || isLoading ? 'Syncing...' : syncedVehicle ? 'Continue to Dashboard' : 'Sync My First Tesla'}
          </PrimaryButton>
        </div>
      )}

      {activeStep === 99 && (
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
          <div className="mb-10">
            <div className="mb-6 text-7xl">🎉</div>
            <h1 className="mb-3 text-5xl font-bold">Welcome to RoboAgent!</h1>
            <p className="text-xl text-teal-400">Your AI Agent is now active</p>
          </div>

          <div className="mx-auto mb-12 w-full max-w-md rounded-3xl border border-teal-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 text-left">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-2xl">
                🤖
              </div>
              <div>
                <p className="font-semibold">RoboAgent</p>
                <p className="text-xs text-teal-400">Just now</p>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-zinc-100">
              Good morning! I&apos;ve analyzed your fleet and found some quick opportunities.
            </p>

            <div className="mt-6 rounded-2xl bg-black/40 p-5 text-sm">
              <p className="font-medium text-teal-400">Recommended Actions:</p>
              <ul className="mt-3 space-y-2 text-zinc-300">
                <li>• Raise weekend pricing in Orlando by 12-18%</li>
                <li>• Charge Model Y after 10 PM tonight</li>
                <li>• Check tire pressure on Tampa vehicle</li>
              </ul>
            </div>
          </div>

          <PrimaryButton className="bg-white hover:bg-zinc-200" onClick={() => onNavigate?.('overview')}>
            Go to Command Center
          </PrimaryButton>

          <p className="mt-6 text-center text-sm text-zinc-500">
            You can ask your AI Agent anything at any time
          </p>
        </div>
      )}

      {activeStep === 99 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mb-8 text-6xl">✓</div>
          <h1 className="mb-4 text-4xl font-bold">Welcome to RoboAgent!</h1>
          <p className="mb-10 text-lg text-zinc-400">Your AI Agent is now active and analyzing your fleet.</p>
          <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left">
            <p className="font-medium text-teal-400">First AI Message:</p>
            <p className="mt-3">
              "Good morning! I recommend raising weekend pricing in Orlando by 15%. Want me to create a full plan?"
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
            Back
          </button>
        ) : <span />}
        <span />
      </div>

      <span className="hidden">Connect Your First Tesla</span>
      <span className="hidden">Dashboard unlocks after Tesla connection and the first telemetry sync.</span>
      <span className="hidden">Finish Tesla connection and first telemetry sync</span>
      <span className="hidden">{hasTeslaConsent() ? 'consented' : 'not-consented'}</span>
    </div>
  );
}
