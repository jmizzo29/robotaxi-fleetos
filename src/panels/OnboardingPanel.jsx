import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSignUp } from '@clerk/react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
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
    <div className="whitespace-nowrap rounded-full border border-[#141b27]/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:px-4 sm:py-1 sm:text-sm">
      <span className="sm:hidden">Step {step}/5</span>
      <span className="hidden sm:inline">Step {step} of 5</span>
    </div>
  );
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`w-full rounded-3xl bg-[#172231] py-5 text-lg font-bold text-white transition hover:bg-[#243044] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const OAUTH_REDIRECT_URL = '/sso-callback';
const OAUTH_COMPLETE_URL = '/#/onboarding';

function getRuntimeClerk() {
  if (typeof window === 'undefined') return null;
  return window.Clerk?.loaded ? window.Clerk : null;
}

function getRuntimeSignUp() {
  return getRuntimeClerk()?.client?.signUp || null;
}

function supportsPrepareEmailVerification(signUpResource) {
  return Boolean(
    signUpResource
    && (
      typeof signUpResource.prepareEmailAddressVerification === 'function'
      || typeof signUpResource.prepareVerification === 'function'
    )
  );
}

function supportsAttemptEmailVerification(signUpResource) {
  return Boolean(
    signUpResource
    && (
      typeof signUpResource.attemptEmailAddressVerification === 'function'
      || typeof signUpResource.attemptVerification === 'function'
    )
  );
}

function pickEmailVerificationResource(...resources) {
  return resources.find((resource) => supportsPrepareEmailVerification(resource) || supportsAttemptEmailVerification(resource)) || null;
}

async function prepareEmailVerification(signUpResource) {
  if (typeof signUpResource?.prepareEmailAddressVerification === 'function') {
    return signUpResource.prepareEmailAddressVerification({ strategy: 'email_code' });
  }
  if (typeof signUpResource?.prepareVerification === 'function') {
    return signUpResource.prepareVerification({ strategy: 'email_code' });
  }
  throw new Error('Email verification is not available for this Clerk signup session.');
}

async function attemptEmailVerification(signUpResource, code) {
  if (typeof signUpResource?.attemptEmailAddressVerification === 'function') {
    return signUpResource.attemptEmailAddressVerification({ code });
  }
  if (typeof signUpResource?.attemptVerification === 'function') {
    return signUpResource.attemptVerification({ strategy: 'email_code', code });
  }
  throw new Error('Email code verification is not available for this Clerk signup session.');
}

function ClerkOAuthButtons() {
  const { isLoaded, signUp } = useSignUp();
  const [oauthError, setOauthError] = useState('');
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const runtimeSignUp = getRuntimeSignUp();
  const clerkReady = Boolean(isLoaded || runtimeSignUp);

  useEffect(() => {
    if (clerkReady) return undefined;
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [clerkReady]);

  const startOAuth = async (strategy) => {
    const activeSignUp = signUp || runtimeSignUp || getRuntimeSignUp();
    if (!activeSignUp) return;
    setOauthError('');
    try {
      await activeSignUp.authenticateWithRedirect({
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
      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => startOAuth('oauth_google')}
          disabled={!clerkReady}
          className="flex items-center justify-center gap-3 rounded-2xl border border-[#141b27]/10 bg-white py-3 font-bold text-[#141b27] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl">G</span>
          Google
        </button>

      </div>

      {oauthError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {oauthError}
        </div>
      )}

      {loadTimedOut && !clerkReady && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Google sign-up is waiting on Clerk. Check that production Clerk keys and Google are enabled.
        </div>
      )}
    </>
  );
}

function OAuthFallbackButtons() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-[#141b27]/10 bg-white py-3 font-bold text-slate-400 opacity-60"
        >
          <span className="text-xl">G</span>
          Google
        </button>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Google OAuth requires Clerk&apos;s public browser key.
      </div>
    </>
  );
}

function permissionCode(title) {
  if (title.startsWith('Vehicle')) return 'LOC';
  if (title.startsWith('Battery')) return 'BAT';
  if (title.startsWith('Health')) return 'HLT';
  return 'ODO';
}

function TeslaConnectionStep({
  hasAccount,
  teslaConnected,
  onNavigate,
  onContinue,
}) {
  const flowSteps = [
    ['1', 'Redirect to Tesla', 'Authenticate directly on Tesla-owned screens.'],
    ['2', 'Approve data scopes', 'You choose whether ROBOAGENT can read vehicle data.'],
    ['3', 'Return to ROBOAGENT', 'We sync telemetry and unlock the command center.'],
  ];

  const trustItems = [
    ['Password private', 'Tesla credentials stay with Tesla.'],
    ['Disconnect anytime', 'Revoke access in settings or Tesla.'],
    ['Owner approved', 'No vehicle command runs without approval.'],
    ['Encrypted tokens', 'OAuth tokens are stored server-side.'],
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-4">
      <div className="mb-6 text-center">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Tesla Connection</p>
        <h2 className="text-3xl font-semibold tracking-tight text-black">Connect Your Tesla</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Use Tesla&apos;s secure login. ROBOAGENT never receives your Tesla password.
        </p>
      </div>

      <section className="grid overflow-hidden rounded-3xl border border-[#141b27]/10 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-[#141b27]/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#172231] text-2xl font-black text-white">
            T
          </div>
          <h3 className="mt-5 text-2xl font-black text-[#141b27]">Official Tesla handoff</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            You will leave ROBOAGENT briefly, approve access with Tesla, then return here to sync your first vehicle.
          </p>

          <div className="mt-6 grid gap-3">
            {flowSteps.map(([step, title, detail]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-[#141b27]/10 bg-[#f7f7f5] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#172231]/10 text-sm font-black text-[#172231]">
                  {step}
                </div>
                <div>
                  <p className="font-black text-[#141b27]">{title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-6">
          <div className="rounded-3xl border border-[#141b27]/10 bg-[#f7f7f5] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Ready to connect</p>
            <h3 className="mt-2 text-xl font-black text-[#141b27]">First Tesla is free during beta</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Connect one vehicle now. Add more later after your first sync is working.
            </p>

            <div className="mt-5">
              {!hasAccount ? (
                <PrimaryButton onClick={() => onNavigate?.('account')} className="py-4 text-base sm:py-5 sm:text-lg">
                  Create ROBOAGENT Account
                </PrimaryButton>
              ) : teslaConnected ? (
                <PrimaryButton onClick={onContinue} className="py-4 text-base sm:py-5 sm:text-lg">
                  Continue to Vehicle Sync
                </PrimaryButton>
              ) : (
                <a
                  href={getTeslaLoginUrl('onboarding')}
                  className="flex w-full items-center justify-center gap-3 rounded-3xl bg-white px-5 py-5 text-lg font-black text-black border border-[#141b27]/10 hover:bg-slate-50"
                >
                  Sign in with Tesla
                </a>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {trustItems.map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-[#141b27]/10 bg-[#f7f7f5] p-4">
                <p className="text-sm font-black text-[#141b27]">{title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ClerkEmailSignUpButton({ email, password, onValidate, onSignedUp }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [clerkError, setClerkError] = useState('');
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [verificationResource, setVerificationResource] = useState(null);
  const runtimeSignUp = getRuntimeSignUp();
  const clerkReady = Boolean(isLoaded || runtimeSignUp);

  useEffect(() => {
    if (clerkReady) return undefined;
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [clerkReady]);

  const finishSignUp = async (createdSessionId) => {
    const activateSession = setActive || getRuntimeClerk()?.setActive?.bind(getRuntimeClerk());
    if (createdSessionId && activateSession) {
      await activateSession({ session: createdSessionId });
    }
    await onSignedUp?.();
  };

  const startSignUp = async () => {
    if (!onValidate()) return;
    const activeSignUp = signUp || getRuntimeSignUp();
    if (!activeSignUp) {
      setClerkError('Secure sign-up is not ready. The live site is still using Clerk development keys or a domain Clerk has not approved. Add production Clerk keys in Vercel, confirm the production domain in Clerk, then redeploy.');
      return;
    }

    setIsSubmitting(true);
    setClerkError('');
    try {
      const result = await activeSignUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === 'complete') {
        await finishSignUp(result.createdSessionId);
        return;
      }

      const emailVerificationResource = pickEmailVerificationResource(
        result,
        activeSignUp,
        signUp,
        getRuntimeSignUp(),
      );
      setVerificationResource(emailVerificationResource);
      await prepareEmailVerification(emailVerificationResource);
      setVerificationSent(true);
    } catch (signUpError) {
      const clerkMessage = signUpError?.errors?.[0]?.longMessage || signUpError?.errors?.[0]?.message;
      setClerkError(clerkMessage || signUpError.message || 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!verificationCode.trim()) {
      setClerkError('Enter the verification code Clerk emailed you.');
      return;
    }

    setIsSubmitting(true);
    setClerkError('');
    try {
      const activeSignUp = verificationResource || signUp || getRuntimeSignUp();
      if (!activeSignUp) {
        setClerkError('Secure sign-up is not ready yet. Refresh the page and try again.');
        return;
      }

      const result = await attemptEmailVerification(activeSignUp, verificationCode.trim());

      if (result.status === 'complete') {
        await finishSignUp(result.createdSessionId);
        return;
      }

      setClerkError('Email verification is not complete yet. Check the code and try again.');
    } catch (verificationError) {
      const clerkMessage = verificationError?.errors?.[0]?.longMessage || verificationError?.errors?.[0]?.message;
      setClerkError(clerkMessage || verificationError.message || 'Could not verify your email code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {verificationSent && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <label htmlFor="onboarding-email-code" className="mb-2 block text-sm font-semibold text-emerald-900">
            Enter the email verification code
          </label>
          <input
            id="onboarding-email-code"
            type="text"
            inputMode="numeric"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-5 text-[#141b27] outline-none transition placeholder:text-slate-400 focus:border-[#172231]"
          />
          <p className="mt-3 text-sm font-semibold text-emerald-800">
            We sent a code to {email}. This keeps signup inside ROBOAGENT.
          </p>
        </div>
      )}

      {clerkError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {clerkError}
        </div>
      )}

      <div id="clerk-captcha" className="min-h-0" />

      {loadTimedOut && !clerkReady && !clerkError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Secure sign-up is waiting on Clerk. If this persists on production, switch Vercel to Clerk production keys and confirm your domain in Clerk.
        </div>
      )}

      <button
        type="button"
        onClick={verificationSent ? verifyEmailCode : startSignUp}
        disabled={isSubmitting}
        className="w-full rounded-3xl bg-[#172231] py-3 text-base font-semibold text-white transition hover:bg-[#243044] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {isSubmitting ? 'Working...' : verificationSent ? 'Verify Email' : 'Create Free Account'}
      </button>
    </div>
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

  const activeStep = step;
  const continueExistingSetup = () => setStep(Math.max(realProgressStep, 1));
  const nextLinearStep = () => setStep((current) => Math.min(current + 1, 5));
  const prevStep = () => setStep((current) => Math.max(current - 1, 1));

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
    nextLinearStep();
  };

  const completeClerkAccount = async () => {
    setMessage('Account created. Next, confirm data permission so ROBOAGENT can connect Tesla securely.');
    try {
      await refreshSession();
    } catch {
      // Clerk may need a moment to expose the new browser session to the backend bridge.
    }
    nextLinearStep();
  };

  const approveConsent = () => {
    verifyBetaInvite('RoboAgent-BETA');
    acceptTeslaConsent();
    setMessage('Consent saved. Next, connect Tesla securely.');
    nextLinearStep();
  };

  const syncFirstVehicle = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onSync?.();
      await refreshSession();
      setMessage('Telemetry sync requested. If the car is awake and permissions are granted, it will appear in ROBOAGENT.');
      nextLinearStep();
    } catch (syncError) {
      setError(syncError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5] px-4 py-3 text-[#141b27] sm:px-6">
      <div className="mx-auto mb-2 flex w-full max-w-6xl items-center justify-between gap-2">
        <button type="button" onClick={() => onNavigate?.('landing')} className="min-w-0 text-sm font-semibold text-[#172231] sm:text-xl">
          <span className="flex items-center gap-3">
            <RoboLogo className="h-8 w-8" />
            <RoboWordmark className="truncate" />
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('landing')}
            className="whitespace-nowrap rounded-full border border-[#141b27]/10 bg-white px-3 py-2 text-xs font-semibold text-[#172231] shadow-sm transition hover:bg-slate-100 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back Home</span>
          </button>
          <StepBadge step={activeStep} />
        </div>
      </div>

      {(message || error) && (
        <div className={`mx-auto mb-4 w-full max-w-5xl rounded-2xl border p-4 text-sm font-semibold ${
          error
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
        >
          {error || message}
        </div>
      )}

      {activeStep === 1 && (
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-5 lg:grid-cols-[0.9fr_1.1fr] lg:py-8">
          <section className="text-center lg:text-left">
            <RoboLogo className="mx-auto mb-3 h-14 w-14 lg:mx-0 sm:mb-4 sm:h-20 sm:w-20" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Secure account</p>
            <h1 className="mt-3 text-3xl font-medium leading-tight text-black sm:text-5xl">
              Create Your ROBOAGENT Account
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7 lg:mx-0">
              One account to manage all your Teslas, rentals, and future Robotaxis
            </p>
            <div className="mt-6 hidden gap-3 lg:grid">
              {[
                ['Private by default', 'Tesla connects only after your ROBOAGENT account is ready.'],
                ['Fast setup', 'Create the account, approve data use, then connect Tesla.'],
                ['Owner controlled', 'Sign out, revoke access, or delete data from settings.'],
              ].map(([title, detail]) => (
                <article key={title} className="rounded-2xl border border-[#141b27]/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-[#141b27]">{title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{detail}</p>
                </article>
              ))}
            </div>
            {realProgressStep > 1 && (
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left lg:mx-0">
                <p className="text-sm font-black text-emerald-900">
                  Existing setup detected for this browser.
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
                  Continue where you left off, or use the sign-in page to switch accounts before connecting Tesla again.
                </p>
                <button
                  type="button"
                  onClick={continueExistingSetup}
                  className="mt-4 w-full rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
                >
                  Continue Existing Setup
                </button>
              </div>
            )}
          </section>

          <section className="mx-auto w-full max-w-md rounded-[1.5rem] border border-[#141b27]/10 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Start free</p>
              <h2 className="mt-2 text-2xl font-semibold text-black">Create account</h2>
            </div>

            <div className="space-y-3">
            <div>
              <label htmlFor="onboarding-email" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Email Address</label>
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
                className={`w-full rounded-2xl border bg-white px-5 py-3 text-[#141b27] outline-none transition placeholder:text-slate-400 focus:border-[#172231] ${
                  accountErrors.email ? 'border-red-400' : 'border-[#141b27]/15'
                }`}
              />
              {accountErrors.email && (
                <p className="mt-2 text-sm font-semibold text-red-600">{accountErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="onboarding-password" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Password</label>
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
                className={`w-full rounded-2xl border bg-white px-5 py-3 text-[#141b27] outline-none transition placeholder:text-slate-400 focus:border-[#172231] ${
                  accountErrors.password ? 'border-red-400' : 'border-[#141b27]/15'
                }`}
              />
              {accountErrors.password && (
                <p className="mt-2 text-sm font-semibold text-red-600">{accountErrors.password}</p>
              )}
            </div>

            {isClerkConfigured() ? (
              <ClerkEmailSignUpButton
                email={accountForm.email.trim()}
                password={accountForm.password}
                onValidate={validateAccountForm}
                onSignedUp={completeClerkAccount}
              />
            ) : (
              <PrimaryButton onClick={createNativeAccount} className="py-3 text-base">
                Create Free Account
              </PrimaryButton>
            )}

            <div className="relative my-1.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative text-center">
                <span className="bg-white px-4 text-sm font-semibold text-slate-500">or continue with</span>
              </div>
            </div>

            <div className="hidden" aria-hidden="true">
              <button
                type="button"
                onClick={() => onNavigate?.('account')}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#141b27]/10 bg-white py-5 transition hover:bg-slate-50"
              >
                <span className="text-xl">G</span>
                Google
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('account')}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#141b27]/10 bg-white py-5 transition hover:bg-slate-50"
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

            <button
              type="button"
              onClick={() => onNavigate?.('account')}
              className="w-full rounded-2xl border border-[#141b27]/10 bg-slate-50 px-5 py-3 text-sm font-bold text-[#172231] transition hover:bg-slate-100"
            >
              Already have an account? Sign in
            </button>
            </div>

          </section>
        </div>
      )}

      {activeStep === 2 && (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-4">
          <div className="mb-6 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Data Permission</p>
            <h2 className="text-3xl font-semibold tracking-tight text-black">A few permissions needed</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              ROBOAGENT needs read-only access to help you maximize earnings
            </p>
          </div>

          <section className="rounded-3xl border border-[#141b27]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#141b27]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-[#141b27]">What ROBOAGENT will access</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Read-only Tesla data for planning, monitoring, and owner-approved recommendations.
                </p>
              </div>
              <span className="w-fit rounded-full border border-[#141b27]/10 bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#141b27]">
                Owner controlled
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['📍', 'Vehicle Location & Status', 'Real-time location, lock status, and software version'],
                ['🔋', 'Battery & Charging', 'Battery level, charging speed, and optimal charge times'],
                ['🛠️', 'Health & Maintenance', 'Tire pressure, brake wear, service alerts'],
                ['📊', 'Odometer & Trip Data', 'Mileage and rental usage data'],
              ].map(([, title, detail]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-[#141b27]/10 bg-[#f7f7f5] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#172231]/10 text-xs font-black tracking-[0.12em] text-[#172231]">{permissionCode(title)}</div>
                  <div className="min-w-0">
                    <p className="font-black text-[#141b27]">{title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[#141b27]/10 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-600">
              You can revoke access anytime in settings. Tesla controls all account authorization.
            </div>
          </section>

          <div className="mx-auto mt-6 w-full max-w-md">
            <PrimaryButton onClick={approveConsent} className="py-4 text-base sm:py-5 sm:text-lg">
              Approve & Continue
            </PrimaryButton>

            <p className="mt-3 text-center text-xs font-semibold text-slate-500">
              Required before connecting Tesla telemetry.
            </p>
          </div>
        </div>
      )}

      {activeStep === 99 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-3xl font-bold">We Need Your Permission</h2>
          <div className="mb-8 space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            <p>ROBOAGENT will access:</p>
            <ul className="space-y-3">
              <li className="flex gap-3"><span>✓</span><span>Vehicle location & status</span></li>
              <li className="flex gap-3"><span>✓</span><span>Battery & charging info</span></li>
              <li className="flex gap-3"><span>✓</span><span>Odometer & service data</span></li>
              <li className="flex gap-3"><span>✓</span><span>Commands with owner approval</span></li>
            </ul>
            <p className="text-sm text-zinc-500">
              Tesla keeps your password. You can revoke access from Tesla or ROBOAGENT anytime.
            </p>
          </div>
          <PrimaryButton onClick={approveConsent}>I Understand & Approve</PrimaryButton>
        </div>
      )}

      {activeStep === 3 && (
        <TeslaConnectionStep
          hasAccount={hasAccount}
          teslaConnected={teslaConnected}
          onNavigate={onNavigate}
          onContinue={nextLinearStep}
        />
      )}

      {activeStep === 'legacy-step-3' && (
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
              <PrimaryButton onClick={() => onNavigate?.('account')}>Create ROBOAGENT Account</PrimaryButton>
            ) : teslaConnected ? (
              <PrimaryButton onClick={nextLinearStep}>Continue to Vehicle Sync</PrimaryButton>
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
                <li>• ROBOAGENT never sees your Tesla password</li>
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
              {syncedVehicle ? 'Your first Tesla is ready for ROBOAGENT' : 'This usually takes 10-20 seconds'}
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
            <h1 className="mb-3 text-5xl font-bold">Welcome to ROBOAGENT!</h1>
            <p className="text-xl text-teal-400">Your AI Agent is now active</p>
          </div>

          <div className="mx-auto mb-12 w-full max-w-md rounded-3xl border border-teal-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 text-left">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-2xl">
                🤖
              </div>
              <div>
                <p className="font-semibold">ROBOAGENT</p>
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
          <h1 className="mb-4 text-4xl font-bold">Welcome to ROBOAGENT!</h1>
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

      <div className="mx-auto mt-5 flex w-full max-w-md justify-between text-sm">
        {activeStep > 1 ? (
          <button type="button" onClick={prevStep} className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 font-semibold text-zinc-400 transition hover:border-teal-400/40 hover:text-teal-200">
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
