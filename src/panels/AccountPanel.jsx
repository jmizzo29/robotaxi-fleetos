import { useEffect, useState } from 'react';
import { SignInButton, SignUpButton } from '@clerk/react';
import { ClerkAccountSummary } from '../auth/ClerkAccountControls';
import { isClerkConfigured } from '../auth/clerkConfig';
import {
  getFleetOsBillingStatus,
  getFleetOsSession,
  loginFleetOsAccount,
  logoutFleetOsAccount,
  registerFleetOsAccount,
  requestFleetOsMagicLink,
  updateFleetOsProfile,
} from '../services/sessionService';
import { getTeslaLoginUrl } from '../services/teslaHealthService';
import { acceptTeslaConsent } from '../services/betaCompliance';

const emptyRegister = {
  name: '',
  email: '',
  password: '',
  inviteCode: '',
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
    />
  );
}

function Step({ number, title, detail }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sky-300/30 bg-sky-300/10 text-sm font-black text-sky-200">
        {number}
      </span>
      <div>
        <p className="font-black text-slate-100">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-100">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-400">{detail}</p> : null}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">or</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function TeslaMark() {
  return (
    <span className="text-xl font-black leading-none tracking-tight" aria-hidden="true">
      T
    </span>
  );
}

function TeslaConsentModal({
  checks,
  onCancel,
  onConfirm,
  onToggle,
  onNavigate,
}) {
  const canAllow = checks.independent && checks.legal;
  const dataRows = [
    'View real-time vehicle data including battery level, location, charging status, odometer, tire pressure, and alerts.',
    'Access basic vehicle commands such as wake vehicle, lock or unlock, start or stop charging, and climate preconditioning.',
    'Receive Fleet Telemetry for smart monitoring and AI recommendations.',
    'View trip history and service information.',
    'Import rental earnings data if you choose to connect Turo later.',
  ];
  const trustRows = [
    'You are granting access only to the vehicles you choose.',
    'FleetOS will never share your data with third parties.',
    'Tesla does not share your login credentials with FleetOS.',
    'You can revoke access at any time directly from your Tesla Account settings.',
    'All sensitive tokens are encrypted and stored securely.',
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Tesla OAuth Consent</p>
            <h2 className="mt-3 text-2xl font-black text-white">FleetOS wants to connect to your Tesla Account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              This lets the FleetOS AI Agent optimize earnings, plan maintenance, manage charging, and run your Tesla rental or robotaxi fleet more efficiently.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black text-slate-300 transition hover:bg-white/10"
            aria-label="Cancel Tesla access"
          >
            X
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <h3 className="font-black text-white">This will allow FleetOS to</h3>
            <ul className="mt-3 space-y-3 text-sm leading-5 text-slate-300">
              {dataRows.map((row) => (
                <li key={row} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span>{row}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/5 p-4">
            <h3 className="font-black text-white">Important details</h3>
            <ul className="mt-3 space-y-3 text-sm leading-5 text-slate-300">
              {trustRows.map((row) => (
                <li key={row} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                  <span>{row}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-sky-300/15 bg-sky-300/5 p-4">
          <h3 className="font-black text-white">Why does FleetOS need this?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            To power the AI Agent that helps you optimize earnings, plan maintenance, manage charging, and run your Tesla rental or robotaxi fleet more efficiently.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-5 text-slate-200">
            <input
              type="checkbox"
              checked={checks.independent}
              onChange={(event) => onToggle('independent', event.target.checked)}
              className="mt-1"
            />
            <span>I understand that FleetOS is a third-party app and is not affiliated with Tesla.</span>
          </label>
          <label className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-5 text-slate-200">
            <input
              type="checkbox"
              checked={checks.legal}
              onChange={(event) => onToggle('legal', event.target.checked)}
              className="mt-1"
            />
            <span>
              I have read and agree to the{' '}
              <button type="button" onClick={() => onNavigate?.('privacy')} className="font-bold text-sky-300 hover:text-sky-200">
                Privacy Policy
              </button>{' '}
              and{' '}
              <button type="button" onClick={() => onNavigate?.('terms')} className="font-bold text-sky-300 hover:text-sky-200">
                Terms of Service
              </button>
              .
            </span>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-slate-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canAllow}
            onClick={onConfirm}
            className="rounded-lg bg-white px-5 py-4 text-sm font-black text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Allow Access
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AccountPanel({ onNavigate }) {
  const [session, setSession] = useState(null);
  const [billing, setBilling] = useState(null);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [magicEmail, setMagicEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [showTeslaConsent, setShowTeslaConsent] = useState(false);
  const [teslaConsentChecks, setTeslaConsentChecks] = useState({
    independent: false,
    legal: false,
  });

  const clerkReady = isClerkConfigured();

  const refresh = async () => {
    const [sessionResult, billingResult] = await Promise.allSettled([
      getFleetOsSession(),
      getFleetOsBillingStatus(),
    ]);

    if (sessionResult.status === 'fulfilled') {
      setSession(sessionResult.value);
      setProfileName(sessionResult.value.user?.name || '');
    } else if (!String(sessionResult.reason?.message || '').toLowerCase().includes('sign in')) {
      throw sessionResult.reason;
    } else {
      setSession({ authenticated: false, user: {} });
      setProfileName('');
    }

    if (billingResult.status === 'fulfilled') {
      setBilling(billingResult.value.billing);
    } else if (!String(billingResult.reason?.message || '').toLowerCase().includes('sign in')) {
      throw billingResult.reason;
    } else {
      setBilling({
        vehicleCount: 0,
        includedVehicles: 1,
        coveredVehicles: 1,
        billableVehicles: 0,
        billingRequired: false,
      });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh().catch((refreshError) => setError(refreshError.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const runAction = async (action, success) => {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const user = session?.user || {};
  const hasRealAccount = Boolean(user.email);
  const billingRequired = Boolean(billing?.billingRequired);
  const activeForm = authMode === 'create' ? 'create' : 'signin';

  const startTeslaSignIn = () => {
    window.location.href = getTeslaLoginUrl('onboarding');
  };

  const confirmTeslaConsent = () => {
    acceptTeslaConsent();
    startTeslaSignIn();
  };

  if (!hasRealAccount) {
    return (
      <div className="grid min-h-[calc(100vh-6rem)] place-items-center px-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-white/10 bg-[#090909] p-8 shadow-2xl shadow-black/50">
          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigate?.('landing')}
              className="mx-auto mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.26em] text-sky-200"
            >
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              FleetOS
            </button>
            <h1 className="text-2xl font-black text-white">Sign in to FleetOS</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Start with your Tesla account. FleetOS never sees your Tesla password.
            </p>
          </div>

          {(message || error) && (
            <div
              className={`mt-6 rounded-lg border p-4 text-sm font-semibold ${
                error
                  ? 'border-red-400/25 bg-red-400/10 text-red-100'
                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
              }`}
            >
              {error || message}
            </div>
          )}

          <div className="mt-7 space-y-4">
            <button
              type="button"
              onClick={() => setShowTeslaConsent(true)}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-5 py-4 text-base font-black text-black transition hover:bg-slate-200"
            >
              <TeslaMark />
              Sign in with Tesla
            </button>
            <p className="text-center text-xs leading-5 text-slate-500">
              You will approve access on Tesla&apos;s secure OAuth screen. We request vehicle status, location, charging, odometer, and alerts so the AI agent can monitor your fleet.
            </p>
          </div>

          {clerkReady ? (
            <div className="mt-7 space-y-4">
              <Divider />
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-black text-slate-100 transition hover:bg-white/10"
                >
                  Continue with Email
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="w-full text-sm font-semibold text-slate-500 transition hover:text-slate-300">
                  Create email account instead
                </button>
              </SignUpButton>
            </div>
          ) : (
            <div className="mt-7 space-y-5">
              <div className="flex rounded-lg border border-white/10 bg-black p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                    activeForm === 'signin'
                      ? 'bg-white text-black'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('create')}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                    activeForm === 'create'
                      ? 'bg-white text-black'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  Create
                </button>
              </div>

              {activeForm === 'signin' ? (
                <div className="space-y-4">
                  <Field label="Email">
                    <Input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                      placeholder="Password"
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(
                        () => loginFleetOsAccount(loginForm),
                        'Signed in successfully.',
                      )
                    }
                    className="w-full rounded-lg bg-white px-5 py-4 text-base font-black text-black transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="Name">
                    <Input
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                      placeholder="Jane Owner"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                      placeholder="8+ characters"
                    />
                  </Field>
                  <Field label="Invite Code">
                    <Input
                      value={registerForm.inviteCode}
                      onChange={(event) => setRegisterForm({ ...registerForm, inviteCode: event.target.value })}
                      placeholder="Provided beta code"
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(
                        () => registerFleetOsAccount(registerForm),
                        'Account created. This browser is now signed in.',
                      )
                    }
                    className="w-full rounded-lg bg-white px-5 py-4 text-base font-black text-black transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
                  >
                    Create FleetOS Account
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-7 text-center">
            <details className="text-left">
              <summary className="cursor-pointer text-center text-sm font-semibold text-slate-500 hover:text-slate-300">
                What happens after sign-in?
              </summary>
              <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <Step
                  number="1"
                  title="Review data consent"
                  detail="FleetOS explains the Tesla data it uses before connection."
                />
                <Step
                  number="2"
                  title="Connect Tesla OAuth"
                  detail="You approve access with Tesla. FleetOS stores encrypted tokens and never gets your Tesla password."
                />
                <Step
                  number="3"
                  title="Open your dashboard"
                  detail="Your first Tesla is free during beta."
                />
              </div>
            </details>
            <p className="mt-5 text-xs leading-5 text-slate-600">
              By signing in, you agree to the FleetOS beta terms and privacy notice.
            </p>
          </div>
        </section>
        {showTeslaConsent ? (
          <TeslaConsentModal
            checks={teslaConsentChecks}
            onCancel={() => setShowTeslaConsent(false)}
            onConfirm={confirmTeslaConsent}
            onNavigate={onNavigate}
            onToggle={(key, value) => setTeslaConsentChecks((current) => ({ ...current, [key]: value }))}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-5xl place-items-center py-4">
      <section className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-300">FleetOS Account</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Sign in to FleetOS</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Create one secure owner account first. After that, FleetOS guides you through data consent and Tesla OAuth.
          </p>

          <div className="mt-6 space-y-4">
            <Step
              number="1"
              title="Sign in or create account"
              detail="Use email-based identity for FleetOS. This is separate from your Tesla password."
            />
            <Step
              number="2"
              title="Review consent"
              detail="You will see exactly what vehicle data FleetOS uses before connecting a Tesla."
            />
            <Step
              number="3"
              title="Connect Tesla securely"
              detail="Tesla OAuth happens after signup. FleetOS never asks for your Tesla password."
            />
          </div>

          <div className="mt-6 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
            First Tesla is free during beta. Add more vehicles later when you are ready.
          </div>
        </aside>

        <main className="rounded-xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 sm:p-6">
          {(message || error) && (
            <div
              className={`mb-5 rounded-lg border p-4 text-sm font-semibold ${
                error
                  ? 'border-red-400/25 bg-red-400/10 text-red-100'
                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
              }`}
            >
              {error || message}
            </div>
          )}

          {hasRealAccount ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Signed In</p>
                <h2 className="mt-2 text-2xl font-black text-white">{user.name || 'FleetOS Owner'}</h2>
                <p className="mt-1 text-sm font-semibold text-emerald-100">{user.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Plan"
                  value="First Tesla Free"
                  detail={`${billing?.vehicleCount || 0} synced vehicle${billing?.vehicleCount === 1 ? '' : 's'}`}
                />
                <Metric label="Included" value={`${billing?.includedVehicles || 1} Tesla`} detail="Beta coverage" />
                <Metric
                  label="Billable"
                  value={billingRequired ? `${billing?.billableVehicles || 0}` : 'None'}
                  detail={billingRequired ? 'Paid plan needed later' : 'No action needed'}
                />
              </div>

              {clerkReady ? <ClerkAccountSummary /> : null}

              <div className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Profile</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Display name"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(
                        () => updateFleetOsProfile({ name: profileName }),
                        'Profile updated.',
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onNavigate?.('onboarding')}
                  className="rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200"
                >
                  Connect Tesla
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('overview')}
                  className="rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15"
                >
                  Open Dashboard
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    runAction(
                      () => logoutFleetOsAccount(),
                      'Signed out on this browser.',
                    )
                  }
                  className="rounded-lg border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-wait disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {clerkReady ? (
                <div>
                  <ClerkAccountSummary />
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">
                    If you do not know your password, choose Clerk&apos;s email code or passwordless option in the sign-in window.
                  </p>
                </div>
              ) : null}

              <div className={clerkReady ? 'hidden' : 'rounded-lg border border-white/10 bg-slate-950/50 p-5'}>
                <div className="mb-5 flex rounded-lg border border-white/10 bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                      activeForm === 'signin'
                        ? 'bg-sky-300 text-slate-950'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('create')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                      activeForm === 'create'
                        ? 'bg-sky-300 text-slate-950'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {activeForm === 'signin' ? (
                  <div className="space-y-4">
                    <Field label="Email">
                      <Input
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field label="Password">
                      <Input
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                        placeholder="Password"
                      />
                    </Field>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          () => loginFleetOsAccount(loginForm),
                          'Signed in successfully.',
                        )
                      }
                      className="w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <Input
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                        placeholder="Jane Owner"
                      />
                    </Field>
                    <Field label="Invite Code">
                      <Input
                        value={registerForm.inviteCode}
                        onChange={(event) => setRegisterForm({ ...registerForm, inviteCode: event.target.value })}
                        placeholder="Provided beta code"
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field label="Password">
                      <Input
                        type="password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                        placeholder="8+ characters"
                      />
                    </Field>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          () => registerFleetOsAccount(registerForm),
                          'Account created. This browser is now signed in.',
                        )
                      }
                      className="sm:col-span-2 w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60"
                    >
                      Create FleetOS Account
                    </button>
                  </div>
                )}
              </div>

              {clerkReady ? (
                <details className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-200">
                    Legacy beta fallback
                  </summary>
                  <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-5">
                    <div className="mb-5 flex rounded-lg border border-white/10 bg-slate-950 p-1">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                          activeForm === 'signin'
                            ? 'bg-sky-300 text-slate-950'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('create')}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-black transition ${
                          activeForm === 'create'
                            ? 'bg-sky-300 text-slate-950'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {activeForm === 'signin' ? (
                      <div className="space-y-4">
                        <Field label="Email">
                          <Input
                            type="email"
                            value={loginForm.email}
                            onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                            placeholder="you@example.com"
                          />
                        </Field>
                        <Field label="Password">
                          <Input
                            type="password"
                            value={loginForm.password}
                            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                            placeholder="Password"
                          />
                        </Field>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(
                              () => loginFleetOsAccount(loginForm),
                              'Signed in successfully.',
                            )
                          }
                          className="w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60"
                        >
                          Sign In
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name">
                          <Input
                            value={registerForm.name}
                            onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                            placeholder="Jane Owner"
                          />
                        </Field>
                        <Field label="Invite Code">
                          <Input
                            value={registerForm.inviteCode}
                            onChange={(event) => setRegisterForm({ ...registerForm, inviteCode: event.target.value })}
                            placeholder="Provided beta code"
                          />
                        </Field>
                        <Field label="Email">
                          <Input
                            type="email"
                            value={registerForm.email}
                            onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                            placeholder="you@example.com"
                          />
                        </Field>
                        <Field label="Password">
                          <Input
                            type="password"
                            value={registerForm.password}
                            onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                            placeholder="8+ characters"
                          />
                        </Field>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(
                              () => registerFleetOsAccount(registerForm),
                              'Account created. This browser is now signed in.',
                            )
                          }
                          className="w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
                        >
                          Create FleetOS Account
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              ) : null}

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-slate-100">Need passwordless beta access?</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Generate a temporary magic link for testing. Email delivery is manual until the beta email provider is connected.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    value={magicEmail}
                    onChange={(event) => setMagicEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(async () => {
                        const result = await requestFleetOsMagicLink({ email: magicEmail });
                        setMagicLink(result.magicLink);
                      }, 'Magic link generated for beta testing.')
                    }
                    className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
                  >
                    Generate
                  </button>
                </div>
                {magicLink ? (
                  <a
                    href={magicLink}
                    className="mt-4 block break-all rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-100"
                  >
                    {magicLink}
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
