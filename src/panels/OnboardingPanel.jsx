import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSignUp } from '@clerk/react';
import {
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronLeft,
  Gauge,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
import { Button, Card, StatusDot } from '../ui';
import { acceptTeslaConsent, verifyBetaInvite } from '../services/betaCompliance';
import { getFleetOsSession } from '../services/sessionService';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

const OAUTH_REDIRECT_URL = '/sso-callback';
const OAUTH_COMPLETE_URL = '/#/onboarding';
const BETA_INVITE_CODE = 'RoboAgent-BETA';
const RESEND_COOLDOWN = 30;
const OAUTH_ERROR_KEYS = ['error', 'tesla_error', 'teslaError', 'oauth_error'];

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Connect Tesla' },
  { id: 3, label: 'First sync' },
];

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

function clerkErrorMessage(unknownError, fallback) {
  const message = unknownError?.errors?.[0]?.longMessage || unknownError?.errors?.[0]?.message || unknownError?.message;
  return message || fallback;
}

function readInitialOAuthError() {
  if (typeof window === 'undefined') return '';
  try {
    const search = new URLSearchParams(window.location.search || '');
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?').slice(1).join('?') : '';
    const hash = new URLSearchParams(hashQuery);
    const found = OAUTH_ERROR_KEYS.some((key) => search.get(key) || hash.get(key));
    if (found) return 'Tesla connection didn’t finish. You can try connecting again below.';
  } catch {
    /* ignore malformed URLs */
  }
  return '';
}

function stripOAuthErrorParams() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    OAUTH_ERROR_KEYS.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    });
    if (url.hash.includes('?')) {
      const [route, query] = url.hash.split('?');
      const hashParams = new URLSearchParams(query);
      OAUTH_ERROR_KEYS.forEach((key) => {
        if (hashParams.has(key)) {
          hashParams.delete(key);
          changed = true;
        }
      });
      const nextQuery = hashParams.toString();
      url.hash = nextQuery ? `${route}?${nextQuery}` : route;
    }
    if (changed) window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore */
  }
}

function Spinner({ className = '' }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} aria-hidden="true" />;
}

function Notice({ tone = 'info', children }) {
  const styles = {
    info: 'border-status-active/20 bg-status-active/5 text-status-active',
    success: 'border-status-ready/20 bg-status-ready/5 text-status-ready',
    warning: 'border-status-caution/25 bg-status-caution/8 text-status-caution',
    error: 'border-status-critical/20 bg-status-critical/5 text-status-critical',
  };
  const assertive = tone === 'error' || tone === 'warning';
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className={`animate-fade-up rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ${styles[tone]}`}
    >
      {children}
    </div>
  );
}

function StepProgress({ step }) {
  const isDone = step > STEPS.length;
  const current = STEPS.find((item) => item.id === step);
  return (
    <div
      className="flex items-center gap-2.5"
      role="group"
      aria-label={isDone ? 'Setup complete' : `Step ${step} of ${STEPS.length}: ${current?.label || ''}`}
    >
      <div className="flex items-center gap-1.5">
        {STEPS.map((item) => {
          const state = isDone || item.id < step ? 'done' : item.id === step ? 'active' : 'todo';
          return (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                state === 'active'
                  ? 'w-6 bg-accent'
                  : state === 'done'
                    ? 'w-1.5 bg-status-ready'
                    : 'w-1.5 bg-ink/15'
              }`}
            />
          );
        })}
      </div>
      <span className="hidden text-xs font-medium text-ink-muted sm:inline">
        {isDone ? 'Done' : `Step ${step} of ${STEPS.length}`}
      </span>
    </div>
  );
}

function TextField({ id, label, error, hint, ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</label>
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-status-active/60 focus:ring-2 focus:ring-status-active/20 ${
          error ? 'border-status-critical/60' : 'border-ink/12'
        }`}
        {...props}
      />
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-status-critical">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}

function GoogleMark() {
  return <span className="text-base font-semibold" aria-hidden="true">G</span>;
}

function ClerkOAuthButtons() {
  const { isLoaded, signUp } = useSignUp();
  const [oauthError, setOauthError] = useState('');
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const runtimeSignUp = getRuntimeSignUp();
  const clerkReady = Boolean(isLoaded || runtimeSignUp);

  useEffect(() => {
    if (clerkReady) return undefined;
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [clerkReady]);

  const startOAuth = async (strategy) => {
    const activeSignUp = signUp || runtimeSignUp || getRuntimeSignUp();
    if (!activeSignUp || isRedirecting) return;
    setOauthError('');
    setIsRedirecting(true);
    try {
      await activeSignUp.authenticateWithRedirect({
        strategy,
        redirectUrl: OAUTH_REDIRECT_URL,
        redirectUrlComplete: OAUTH_COMPLETE_URL,
      });
    } catch (authError) {
      setIsRedirecting(false);
      setOauthError(clerkErrorMessage(authError, 'Could not start secure Google sign up. Try again.'));
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => startOAuth('oauth_google')}
        disabled={!clerkReady || isRedirecting}
        aria-busy={isRedirecting}
        className="w-full"
      >
        {isRedirecting ? <Spinner /> : <GoogleMark />}
        {isRedirecting ? 'Redirecting to Google…' : 'Continue with Google'}
      </Button>

      {oauthError && <Notice tone="error">{oauthError}</Notice>}

      {loadTimedOut && !clerkReady && (
        <Notice tone="warning">
          Google sign-up is waiting on Clerk. Confirm production Clerk keys and Google are enabled.
        </Notice>
      )}
    </>
  );
}

function OAuthFallbackButtons() {
  return (
    <>
      <Button variant="secondary" size="lg" disabled className="w-full">
        <GoogleMark />
        Google
      </Button>
      <Notice tone="warning">Google OAuth requires Clerk&apos;s public browser key.</Notice>
    </>
  );
}

function ClerkEmailSignUpButton({ email, password, onValidate, onSignedUp }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [clerkError, setClerkError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [verificationResource, setVerificationResource] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const codeRef = useRef(null);
  const runtimeSignUp = getRuntimeSignUp();
  const clerkReady = Boolean(isLoaded || runtimeSignUp);

  useEffect(() => {
    if (clerkReady) return undefined;
    const timer = window.setTimeout(() => setLoadTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [clerkReady]);

  // Move focus to the code field as soon as the verification step appears.
  useEffect(() => {
    if (verificationSent) codeRef.current?.focus();
  }, [verificationSent]);

  // Resend cooldown countdown (decrements inside a timer callback, never synchronously in the effect body).
  useEffect(() => {
    if (!verificationSent || resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [verificationSent, resendIn]);

  const finishSignUp = async (createdSessionId) => {
    const activateSession = setActive || getRuntimeClerk()?.setActive?.bind(getRuntimeClerk());
    if (createdSessionId && activateSession) {
      await activateSession({ session: createdSessionId });
    }
    await onSignedUp?.();
  };

  const startSignUp = async () => {
    if (isSubmitting || !onValidate()) return;
    const activeSignUp = signUp || getRuntimeSignUp();
    if (!activeSignUp) {
      setClerkError('Secure sign-up is not ready. The live site is still using Clerk development keys or a domain Clerk has not approved. Add production Clerk keys in Vercel, confirm the production domain in Clerk, then redeploy.');
      return;
    }

    setIsSubmitting(true);
    setClerkError('');
    setStatusMessage('');
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
      setResendIn(RESEND_COOLDOWN);
      setStatusMessage(`We sent a 6-digit code to ${email}.`);
    } catch (signUpError) {
      setClerkError(clerkErrorMessage(signUpError, 'Could not create your account. Check your details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmailCode = async (codeArg) => {
    const code = String(codeArg ?? verificationCode).trim();
    if (isSubmitting) return;
    if (code.length < 6) {
      setClerkError('Enter the 6-digit code we emailed you.');
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

      const result = await attemptEmailVerification(activeSignUp, code);

      if (result.status === 'complete') {
        await finishSignUp(result.createdSessionId);
        return;
      }

      setClerkError('That code didn’t complete verification. Double-check it or send a new one.');
    } catch (verificationError) {
      setClerkError(clerkErrorMessage(verificationError, 'That code didn’t work. It may be wrong or expired — try again or resend.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(digits);
    if (clerkError) setClerkError('');
    if (digits.length === 6 && !isSubmitting) {
      verifyEmailCode(digits);
    }
  };

  const resendCode = async () => {
    if (resendIn > 0 || resendBusy) return;
    const activeSignUp = verificationResource || signUp || getRuntimeSignUp();
    if (!activeSignUp) {
      setClerkError('Secure sign-up is not ready yet. Refresh the page and try again.');
      return;
    }
    setResendBusy(true);
    setClerkError('');
    setStatusMessage('');
    try {
      await prepareEmailVerification(activeSignUp);
      setStatusMessage('New code sent. Check your inbox (and spam).');
      setResendIn(RESEND_COOLDOWN);
    } catch (resendError) {
      setClerkError(clerkErrorMessage(resendError, 'Could not resend the code. Try again in a moment.'));
    } finally {
      setResendBusy(false);
    }
  };

  const editEmail = () => {
    setVerificationSent(false);
    setVerificationCode('');
    setClerkError('');
    setStatusMessage('');
    setResendIn(0);
  };

  return (
    <div className="space-y-4">
      {verificationSent && (
        <div className="animate-fade-up rounded-2xl border border-status-ready/25 bg-status-ready/5 p-4">
          <label htmlFor="onboarding-email-code" className="mb-2 block text-sm font-medium text-ink">
            Enter the code we emailed to <span className="break-all font-semibold">{email}</span>
          </label>
          <input
            id="onboarding-email-code"
            ref={codeRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            maxLength={6}
            aria-label="6-digit email verification code"
            aria-invalid={clerkError ? 'true' : undefined}
            value={verificationCode}
            onChange={(event) => handleCodeChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                verifyEmailCode();
              }
            }}
            placeholder="••••••"
            className="w-full rounded-2xl border border-ink/12 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-ink outline-none transition placeholder:tracking-[0.5em] placeholder:text-ink-subtle focus:border-status-ready/60 focus:ring-2 focus:ring-status-ready/20"
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={resendCode}
              disabled={resendIn > 0 || resendBusy}
              className="inline-flex items-center gap-1.5 font-medium text-status-active transition hover:text-ink disabled:cursor-not-allowed disabled:text-ink-subtle"
            >
              {resendBusy && <Spinner className="h-3.5 w-3.5" />}
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={editEmail}
              className="font-medium text-ink-muted transition hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        </div>
      )}

      {statusMessage && !clerkError && (
        <p role="status" aria-live="polite" className="text-xs font-medium text-status-ready">{statusMessage}</p>
      )}

      {clerkError && <Notice tone="error">{clerkError}</Notice>}

      <div id="clerk-captcha" className="min-h-0" />

      {loadTimedOut && !clerkReady && !clerkError && (
        <Notice tone="warning">
          Secure sign-up is waiting on Clerk. If this persists on production, switch Vercel to Clerk production keys and confirm your domain in Clerk.
        </Notice>
      )}

      <Button
        type="submit"
        size="lg"
        onClick={() => (verificationSent ? verifyEmailCode() : startSignUp())}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full"
      >
        {isSubmitting && <Spinner />}
        {isSubmitting
          ? (verificationSent ? 'Verifying…' : 'Creating account…')
          : (verificationSent ? 'Verify email' : 'Create free account')}
      </Button>
    </div>
  );
}

function AccountStep({
  accountForm,
  accountErrors,
  onChangeField,
  onNativeSubmit,
  onClerkSignedUp,
  validateAccountForm,
  onNavigate,
}) {
  const clerkReady = isClerkConfigured();

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 py-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="text-center lg:text-left">
        <RoboLogo className="mx-auto mb-5 h-14 w-14 lg:mx-0" />
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Create your ROBOAGENT account
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-muted lg:mx-0">
          One account for every Tesla you run. Connect a car next — it takes about a minute.
        </p>

        <div className="mt-8 hidden gap-3 lg:grid">
          {[
            [Lock, 'Private by default', 'Tesla connects only after your account is ready.'],
            [ShieldCheck, 'Read-only access', 'ROBOAGENT never drives or unlocks your car.'],
            [RefreshCw, 'Revoke anytime', 'Disconnect from settings or Tesla in one tap.'],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-sm text-ink-muted">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card padding="p-6 sm:p-7" className="mx-auto w-full max-w-md animate-fade-up">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!clerkReady) onNativeSubmit();
          }}
        >
          <TextField
            id="onboarding-email"
            label="Email Address"
            type="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            value={accountForm.email}
            onChange={(event) => onChangeField('email', event.target.value)}
            placeholder="you@email.com"
            error={accountErrors.email}
          />
          <TextField
            id="onboarding-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            enterKeyHint="go"
            value={accountForm.password}
            onChange={(event) => onChangeField('password', event.target.value)}
            placeholder="At least 8 characters"
            error={accountErrors.password}
            hint={accountErrors.password ? undefined : 'Use 8+ characters.'}
          />

          {clerkReady ? (
            <ClerkEmailSignUpButton
              email={accountForm.email.trim()}
              password={accountForm.password}
              onValidate={validateAccountForm}
              onSignedUp={onClerkSignedUp}
            />
          ) : (
            <Button type="submit" size="lg" className="w-full">Create Free Account</Button>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-ink/10" />
            </div>
            <div className="relative text-center">
              <span className="bg-surface-raised px-3 text-xs font-medium text-ink-subtle">or</span>
            </div>
          </div>

          {clerkReady ? <ClerkOAuthButtons /> : <OAuthFallbackButtons />}
        </form>

        <button
          type="button"
          onClick={() => onNavigate?.('account')}
          className="mt-4 w-full rounded-xl py-1 text-center text-sm font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
        >
          Already have an account? <span className="text-status-active">Sign in</span>
        </button>
      </Card>
    </div>
  );
}

const DATA_POINTS = [
  [MapPin, 'Location & status', 'Live position, lock state, and software version.'],
  [BatteryCharging, 'Battery & charging', 'Charge level, charging speed, and best times to plug in.'],
  [Wrench, 'Health & maintenance', 'Tire pressure, service alerts, and downtime risks.'],
  [Gauge, 'Trips & odometer', 'Mileage and usage to estimate earnings.'],
];

const DATA_DETAILS = [
  ['Location', 'Precise GPS and parking context', 'Fleet map, utilization, and pickup planning'],
  ['Vehicle status', 'Battery, range, charging, online state', 'Readiness alerts and charging optimization'],
  ['Health', 'Tire pressure, service, and alerts Tesla exposes', 'Predictive maintenance and safety reminders'],
  ['Odometer & trips', 'Mileage and historical movement', 'Maintenance intervals and earnings estimates'],
];

function ConnectStep({ hasAccount, teslaConnected, connecting, onConnect, onContinue, onBackToAccount }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-6">
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-status-ready/20 bg-status-ready/8 px-3 py-1 text-xs font-medium text-status-ready">
          <ShieldCheck className="h-3.5 w-3.5" />
          Official Tesla Fleet API
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Connect your Tesla</h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-muted">
          You&apos;ll approve read-only access on Tesla&apos;s own screens, then come right back. Your password stays with Tesla.
        </p>
      </div>

      {teslaConnected && (
        <div className="mx-auto mt-5 inline-flex items-center gap-2 self-center rounded-full border border-status-ready/25 bg-status-ready/8 px-4 py-1.5 text-sm font-medium text-status-ready">
          <StatusDot tone="ready" />
          Tesla connected
        </div>
      )}

      <Card padding="p-5 sm:p-6" className="mt-6 animate-fade-up">
        <p className="text-sm font-medium text-ink">What ROBOAGENT reads</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {DATA_POINTS.map(([Icon, title, detail]) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-ink/8 bg-surface p-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs leading-relaxed text-ink-muted">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-status-ready" /> Read-only</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-status-ready" /> Encrypted tokens</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-status-ready" /> Revoke anytime</span>
        </div>

        <details className="group mt-3">
          <summary className="cursor-pointer list-none rounded-xl text-sm font-medium text-status-active transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30">
            See exactly what&apos;s accessed and why
          </summary>
          <div className="mt-3 space-y-2 border-t border-ink/8 pt-3">
            {DATA_DETAILS.map(([category, details, reason]) => (
              <div key={category} className="grid gap-0.5 text-xs sm:grid-cols-[0.7fr_1.3fr_1.3fr] sm:gap-3">
                <p className="font-medium text-ink">{category}</p>
                <p className="text-ink-muted">{details}</p>
                <p className="text-ink-muted">{reason}</p>
              </div>
            ))}
            <p className="pt-1 text-xs text-ink-subtle">
              ROBOAGENT is independent and not affiliated with Tesla. Tesla controls vehicle access and approvals.
            </p>
          </div>
        </details>
      </Card>

      <div className="mt-6 animate-fade-up">
        {!hasAccount ? (
          <Button size="lg" className="w-full" onClick={onBackToAccount}>
            Create your account first
          </Button>
        ) : teslaConnected ? (
          <Button size="lg" className="w-full" onClick={onContinue}>
            Continue to first sync
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={onConnect} disabled={connecting} aria-busy={connecting}>
            {connecting ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
            {connecting ? 'Redirecting to Tesla…' : 'Agree & connect Tesla'}
          </Button>
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-subtle">
          By continuing you authorize ROBOAGENT to read the data above. Required before your first sync.
        </p>
      </div>
    </div>
  );
}

function SyncStep({ teslaConnected, syncedVehicle, busy, onSync }) {
  const heading = syncedVehicle ? 'Vehicle synced' : busy ? 'Finding your vehicles…' : 'Run your first sync';
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-status-ready/10">
          {syncedVehicle ? (
            <Check className="h-7 w-7 text-status-ready" />
          ) : (
            <RefreshCw className={`h-7 w-7 text-accent ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
          )}
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-ink" aria-live="polite">{heading}</h2>
        <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-ink-muted">
          {syncedVehicle
            ? 'Your Tesla is connected and ready for the command center.'
            : 'We pull your vehicle list, battery, and status from the Tesla Fleet API. Takes about 10–20 seconds.'}
        </p>
      </div>

      <Card padding="p-4" className="mt-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 text-xl" aria-hidden="true">🚗</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Your Tesla</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
              <StatusDot tone={syncedVehicle ? 'ready' : 'active'} pulse={busy || !syncedVehicle} />
              {syncedVehicle ? 'Connected' : busy ? 'Syncing telemetry…' : 'Ready to sync'}
            </div>
          </div>
        </div>
      </Card>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!teslaConnected || busy}
        aria-busy={busy}
        onClick={onSync}
      >
        {busy && <Spinner />}
        {busy ? 'Syncing…' : syncedVehicle ? 'Continue to dashboard' : 'Sync my first Tesla'}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </Button>
      {!teslaConnected && (
        <p className="mt-3 text-center text-xs text-ink-subtle">Connect your Tesla first to enable syncing.</p>
      )}
    </div>
  );
}

function SuccessStep({ onNavigate }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 text-center">
      <div className="animate-fade-up">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-status-ready/10">
          <Check className="h-7 w-7 text-status-ready" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">You&apos;re all set</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Your AI fleet agent is live and analyzing your Tesla.
        </p>
      </div>

      <Card padding="p-5" className="mt-7 animate-fade-up text-left">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-ready/10 text-status-ready">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">ROBOAGENT</p>
            <p className="text-xs text-ink-subtle">Just now</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink">
          I&apos;ve analyzed your fleet and spotted a few quick wins:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
          <li>• Raise weekend pricing in Orlando by 12–18%</li>
          <li>• Charge after 10 PM tonight for the best rate</li>
          <li>• Check tire pressure on the Tampa vehicle</li>
        </ul>
      </Card>

      <Button size="lg" className="mt-7 w-full" onClick={() => onNavigate?.('overview')}>
        Go to command center
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="mt-4 text-xs text-ink-subtle">You can ask your agent anything, anytime.</p>
    </div>
  );
}

export default function OnboardingPanel({
  realVehicleCount = 0,
  isLoading = false,
  onSync,
  onNavigate,
}) {
  const [manualStep, setManualStep] = useState(null);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(() => readInitialOAuthError());
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [accountErrors, setAccountErrors] = useState({});

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await getFleetOsSession();
      setSession(nextSession);
    } catch {
      // No session yet (signed out, or backend unreachable in local dev): treat as a clean start.
      setSession({ authenticated: false, user: {} });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  // Clean any Tesla OAuth error params out of the URL once we've captured them.
  useEffect(() => {
    stripOAuthErrorParams();
  }, []);

  const hasAccount = Boolean(session?.user?.email);
  const teslaConnected = Boolean(session?.teslaConnected);
  const syncedVehicle = realVehicleCount > 0;

  const realProgressStep = useMemo(() => {
    if (!hasAccount) return 1;
    if (!teslaConnected) return 2;
    if (!syncedVehicle) return 3;
    return 4;
  }, [hasAccount, syncedVehicle, teslaConnected]);

  // Manual navigation wins; otherwise follow real progress so returning from Tesla OAuth lands on the right step.
  const step = manualStep ?? realProgressStep;
  const goToStep = (next) => setManualStep(Math.min(Math.max(next, 1), 4));

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

  const handleChangeField = (field, value) => {
    setAccountForm((current) => ({ ...current, [field]: value }));
    setAccountErrors((current) => ({ ...current, [field]: '' }));
  };

  const createNativeAccount = () => {
    if (!validateAccountForm()) return;
    goToStep(2);
  };

  const completeClerkAccount = async () => {
    setError('');
    setMessage('Account created. Next, connect your Tesla securely.');
    try {
      await refreshSession();
    } catch {
      // Clerk may need a moment to expose the new browser session to the backend bridge.
    }
    goToStep(2);
  };

  const connectTesla = () => {
    setError('');
    try {
      verifyBetaInvite(BETA_INVITE_CODE);
      acceptTeslaConsent();
      setConnecting(true);
      window.location.href = getTeslaLoginUrl('onboarding');
    } catch (connectError) {
      setConnecting(false);
      setError(connectError.message || 'Could not start the Tesla connection. Please try again.');
    }
  };

  const syncFirstVehicle = async () => {
    if (syncedVehicle) {
      onNavigate?.('overview');
      return;
    }
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onSync?.();
      await refreshSession();
      setMessage('Telemetry sync requested. If the car is awake and permissions are granted, it will appear in ROBOAGENT.');
      goToStep(4);
    } catch (syncError) {
      setError(syncError.message || 'Sync failed. Make sure the car is awake, then try again.');
    } finally {
      setBusy(false);
    }
  };

  const syncBusy = busy || isLoading;

  return (
    <div className="flex min-h-screen flex-col bg-surface px-4 py-4 text-ink sm:px-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.('landing')}
          className="flex min-w-0 items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
        >
          <RoboLogo className="h-7 w-7 shrink-0" />
          <RoboWordmark className="hidden truncate text-sm sm:inline" />
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <StepProgress step={step} />
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('landing')}>
            <span className="sm:hidden">Home</span>
            <span className="hidden sm:inline">Back Home</span>
          </Button>
        </div>
      </header>

      {(message || error) && (
        <div className="mx-auto mt-4 w-full max-w-2xl">
          <Notice tone={error ? 'error' : 'success'}>{error || message}</Notice>
        </div>
      )}

      {step === 1 && (
        <AccountStep
          accountForm={accountForm}
          accountErrors={accountErrors}
          onChangeField={handleChangeField}
          onNativeSubmit={createNativeAccount}
          onClerkSignedUp={completeClerkAccount}
          validateAccountForm={validateAccountForm}
          onNavigate={onNavigate}
        />
      )}

      {step === 2 && (
        <ConnectStep
          hasAccount={hasAccount}
          teslaConnected={teslaConnected}
          connecting={connecting}
          onConnect={connectTesla}
          onContinue={() => goToStep(3)}
          onBackToAccount={() => goToStep(1)}
        />
      )}

      {step === 3 && (
        <SyncStep
          teslaConnected={teslaConnected}
          syncedVehicle={syncedVehicle}
          busy={syncBusy}
          onSync={syncFirstVehicle}
        />
      )}

      {step >= 4 && <SuccessStep onNavigate={onNavigate} />}

      {step > 1 && step < 4 && (
        <div className="mx-auto w-full max-w-2xl pb-2">
          <Button variant="ghost" size="sm" onClick={() => goToStep(step - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
