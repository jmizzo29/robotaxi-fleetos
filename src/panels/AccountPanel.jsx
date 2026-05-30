import { useEffect, useState } from 'react';
import { SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { isClerkConfigured } from '../auth/clerkConfig';
import {
  getFleetOsBillingStatus,
  getFleetOsSession,
  loginFleetOsAccount,
  logoutFleetOsAccount,
  registerFleetOsAccount,
  updateFleetOsProfile,
} from '../services/sessionService';
import { acceptTeslaConsent } from '../services/betaCompliance';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

const emptyRegister = {
  name: '',
  email: '',
  password: '',
  inviteCode: '',
};

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-500"
    />
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function TrustRow({ title, detail }) {
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-zinc-300">{detail}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function TeslaConsentModal({ checks, onCancel, onConfirm, onNavigate, onToggle }) {
  const canAllow = checks.independent && checks.legal;
  const dataRows = [
    'Real-time vehicle data such as battery, location, charging status, odometer, tire pressure, and alerts.',
    'Owner-approved vehicle commands such as wake, lock/unlock, start/stop charging, and climate preconditioning.',
    'Fleet telemetry used for smart monitoring, maintenance alerts, and AI recommendations.',
    'Trip/service context and optional rental earnings imports when you connect those sources.',
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-700 bg-gradient-to-b from-zinc-950 to-black p-6 text-white shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-400">Tesla OAuth Consent</p>
            <h2 className="mt-3 text-2xl font-black">RoboAgent wants to connect to your Tesla Account</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Tesla login happens directly with Tesla. RoboAgent never sees your Tesla password.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm font-black text-zinc-300 transition hover:bg-zinc-800"
            aria-label="Cancel Tesla access"
          >
            X
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="font-black">This allows RoboAgent to use:</h3>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-zinc-300">
            {dataRows.map((row) => (
              <li key={row} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                <span>{row}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TrustRow title="You stay in control" detail="Disconnect Tesla or delete RoboAgent data from the app." />
          <TrustRow title="Not affiliated with Tesla" detail="RoboAgent is an independent third-party app." />
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-semibold leading-5 text-zinc-300">
            <input
              type="checkbox"
              checked={checks.independent}
              onChange={(event) => onToggle('independent', event.target.checked)}
              className="mt-1"
            />
            <span>I understand RoboAgent is a third-party app and is not affiliated with Tesla.</span>
          </label>
          <label className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-semibold leading-5 text-zinc-300">
            <input
              type="checkbox"
              checked={checks.legal}
              onChange={(event) => onToggle('legal', event.target.checked)}
              className="mt-1"
            />
            <span>
              I have read and agree to the{' '}
              <button type="button" onClick={() => onNavigate?.('privacy')} className="font-black text-teal-300 hover:text-teal-200">
                Privacy Policy
              </button>{' '}
              and{' '}
              <button type="button" onClick={() => onNavigate?.('terms')} className="font-black text-teal-300 hover:text-teal-200">
                Terms
              </button>
              .
            </span>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-black text-zinc-200 transition hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canAllow}
            onClick={onConfirm}
            className="rounded-2xl bg-teal-500 px-5 py-4 text-sm font-black text-black transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
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
  const [profileName, setProfileName] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showTeslaConsent, setShowTeslaConsent] = useState(false);
  const [teslaConsentChecks, setTeslaConsentChecks] = useState({ independent: false, legal: false });

  const clerkReady = isClerkConfigured();
  const user = session?.user || {};
  const hasRealAccount = Boolean(user.email);

  const refresh = async () => {
    const [sessionResult, billingResult] = await Promise.allSettled([
      getFleetOsSession(),
      getFleetOsBillingStatus(),
    ]);

    if (sessionResult.status === 'fulfilled') {
      setSession(sessionResult.value);
      setProfileName(sessionResult.value.user?.name || '');
    } else {
      setSession({ authenticated: false, user: {} });
      setProfileName('');
    }

    if (billingResult.status === 'fulfilled') {
      setBilling(billingResult.value.billing);
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

  const confirmTeslaConsent = () => {
    if (!hasRealAccount) {
      setShowTeslaConsent(false);
      setError('Sign in to RoboAgent first. Then connect Tesla from onboarding.');
      return;
    }
    acceptTeslaConsent();
    window.location.href = getTeslaLoginUrl('onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black px-4 py-6 text-white">
      <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <button type="button" onClick={() => onNavigate?.('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-400 shadow-lg shadow-teal-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.28em] text-sky-200">RoboAgent</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('landing')}
          className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-black text-zinc-200 transition hover:bg-zinc-800"
        >
          Back Home
        </button>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7 shadow-2xl shadow-black/30">
          <div className="mb-7 flex justify-center lg:justify-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-xl shadow-teal-500/30">
              <span className="text-5xl font-black tracking-tighter text-black">R</span>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-400">Secure account</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Sign in to RoboAgent</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-zinc-400">
            Use one owner account for RoboAgent. Tesla connection comes next through Tesla OAuth, so your Tesla password stays with Tesla.
          </p>

          <div className="mt-6 grid gap-3">
            <TrustRow title="First Tesla free" detail="Start with one vehicle during beta before adding more." />
            <TrustRow title="Tesla OAuth second" detail="Vehicle access is separate from your RoboAgent account." />
            <TrustRow title="Delete anytime" detail="Admin and user controls can purge beta data and Tesla sync." />
          </div>
        </aside>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
          {(message || error) && (
            <div className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${
              error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}>
              {error || message}
            </div>
          )}

          {!hasRealAccount ? (
            <div className="space-y-5">
              {clerkReady ? (
                <div className="space-y-4">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-3xl bg-teal-500 px-5 py-6 text-xl font-semibold text-black transition hover:bg-teal-400"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-3xl border border-zinc-700 bg-zinc-900 px-5 py-6 text-xl font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Create Account
                    </button>
                  </SignUpButton>
                  <p className="text-center text-sm font-semibold leading-6 text-zinc-500">
                    Sign in or create an account, then continue onboarding to connect Tesla.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex rounded-2xl border border-zinc-800 bg-zinc-900 p-1">
                    {[
                      ['signin', 'Sign In'],
                      ['create', 'Create'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAuthMode(mode)}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                          authMode === mode ? 'bg-teal-500 text-black shadow-sm' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {authMode === 'signin' ? (
                    <div className="space-y-4">
                      <Field label="Email">
                        <TextInput
                          type="email"
                          value={loginForm.email}
                          onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                          placeholder="you@example.com"
                        />
                      </Field>
                      <Field label="Password">
                        <TextInput
                          type="password"
                          value={loginForm.password}
                          onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                          placeholder="Password"
                        />
                      </Field>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runAction(() => loginFleetOsAccount(loginForm), 'Signed in successfully.')}
                        className="w-full rounded-3xl bg-teal-500 px-5 py-6 text-xl font-semibold text-black transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-60"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Field label="Name">
                        <TextInput value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} placeholder="Jane Owner" />
                      </Field>
                      <Field label="Email">
                        <TextInput type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} placeholder="you@example.com" />
                      </Field>
                      <Field label="Password">
                        <TextInput type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} placeholder="8+ characters" />
                      </Field>
                      <Field label="Invite Code">
                        <TextInput value={registerForm.inviteCode} onChange={(event) => setRegisterForm({ ...registerForm, inviteCode: event.target.value })} placeholder="Provided beta code" />
                      </Field>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runAction(() => registerFleetOsAccount(registerForm), 'Account created. This browser is now signed in.')}
                        className="w-full rounded-3xl bg-teal-500 px-5 py-6 text-xl font-semibold text-black transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-60"
                      >
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowTeslaConsent(true)}
                className="w-full rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-4 text-sm font-black text-teal-200 transition hover:bg-teal-500/20"
              >
                Preview Tesla Data Permissions
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Signed In</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{user.name || 'RoboAgent Owner'}</h2>
                  <p className="mt-1 text-sm font-semibold text-emerald-200">{user.email}</p>
                </div>
                {clerkReady ? <UserButton /> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Plan" value="Free" />
                <Metric label="Included" value={`${billing?.includedVehicles || 1} Tesla`} />
                <Metric label="Synced" value={billing?.vehicleCount || 0} />
              </div>

              <Field label="Display Name">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <TextInput
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Display name"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => runAction(() => updateFleetOsProfile({ name: profileName }), 'Profile updated.')}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-black text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => onNavigate?.('onboarding')} className="rounded-2xl bg-teal-500 px-5 py-4 text-sm font-black text-black transition hover:bg-teal-400">
                  Continue Onboarding
                </button>
                <button type="button" onClick={() => onNavigate?.('overview')} className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-black text-zinc-200 transition hover:bg-zinc-800">
                  Open Dashboard
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runAction(() => logoutFleetOsAccount(), 'Signed out on this browser.')}
                  className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowTeslaConsent(true)}
                className="w-full rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-4 text-sm font-black text-teal-200 transition hover:bg-teal-500/20"
              >
                Preview Tesla Data Permissions
              </button>
            </div>
          )}
        </section>
      </main>

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
