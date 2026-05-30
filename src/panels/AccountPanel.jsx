import { useEffect, useState } from 'react';
import { isClerkConfigured } from '../auth/clerkConfig';
import {
  getFleetOsBillingStatus,
  getFleetOsSession,
  loginFleetOsAccount,
  logoutFleetOsAccount,
  registerFleetOsAccount,
  updateFleetOsProfile,
} from '../services/sessionService';

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
      className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-500 sm:py-4"
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

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
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

  const openClerkAuth = async (mode) => {
    setError('');
    setMessage('');
    setAuthMode(mode);

    if (!window.Clerk?.loaded) {
      setError('Account service is still loading. Try again in a moment.');
      return;
    }

    const redirectUrl = `${window.location.origin}/#/onboarding`;
    const options = {
      fallbackRedirectUrl: redirectUrl,
      signInFallbackRedirectUrl: redirectUrl,
      signUpFallbackRedirectUrl: redirectUrl,
    };

    if (mode === 'create') {
      await window.Clerk.openSignUp(options);
      return;
    }

    await window.Clerk.openSignIn(options);
  };

  const signOut = async () => {
    setIsBusy(true);
    setError('');
    setMessage('');
    setSession({ authenticated: false, user: {} });
    onNavigate?.('landing');

    try {
      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] px-4 py-5 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <button type="button" onClick={() => onNavigate?.('landing')} className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-400 shadow-lg shadow-teal-300/50" />
          <span className="text-sm font-black uppercase tracking-[0.24em] text-teal-200">RoboAgent</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('landing')}
          className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Home
        </button>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-92px)] max-w-3xl place-items-center py-5 sm:py-8">
        <section className="w-full max-w-[480px] rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40 sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Account</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {hasRealAccount ? 'You are signed in' : 'Sign in to RoboAgent'}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-5 text-zinc-400 sm:leading-6">
              {hasRealAccount
                ? 'Manage this browser session.'
                : 'Use your account first. Tesla connects after sign in.'}
            </p>
          </div>

          {(message || error) && (
            <div className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${
              error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}>
              {error || message}
            </div>
          )}

          {!hasRealAccount ? (
            <div className="space-y-4">
              {clerkReady ? (
                <>
                  <button
                    type="button"
                    onClick={() => openClerkAuth('signin')}
                    className="w-full rounded-2xl bg-teal-500 px-5 py-4 text-base font-black text-black transition hover:bg-teal-400"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openClerkAuth('create')}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-base font-black text-zinc-100 transition hover:bg-zinc-800"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  <div className="flex rounded-2xl border border-zinc-800 bg-zinc-900 p-1">
                    {[
                      ['signin', 'Sign In'],
                      ['create', 'Create'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAuthMode(mode)}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition sm:py-3 ${
                          authMode === mode ? 'bg-teal-500 text-black shadow-sm' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {authMode === 'signin' ? (
                    <div className="space-y-3 sm:space-y-4">
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
                        className="w-full rounded-2xl bg-teal-500 px-5 py-3.5 text-base font-black text-black transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-60 sm:py-4"
                      >
                        {isBusy ? 'Signing In...' : 'Sign In'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
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
                        className="w-full rounded-2xl bg-teal-500 px-5 py-4 text-base font-black text-black transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isBusy ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  )}
                </>
              )}

              <p className="text-center text-xs font-semibold leading-5 text-zinc-600">
                Tesla login is separate and comes next.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Signed In</p>
                <p className="mt-2 text-lg font-black text-white">{user.name || 'RoboAgent Owner'}</p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-400">{user.email}</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.('overview')}
                className="w-full rounded-2xl bg-teal-500 px-5 py-4 text-base font-black text-black transition hover:bg-teal-400"
              >
                Open Dashboard
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={signOut}
                className="w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-base font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {isBusy ? 'Signing Out...' : 'Sign Out'}
              </button>

              <details className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <summary className="cursor-pointer text-sm font-black text-zinc-300">Account Details</summary>
                <div className="mt-4 space-y-4">
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
                  <button
                    type="button"
                    onClick={() => onNavigate?.('onboarding')}
                    className="w-full rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-4 text-sm font-black text-teal-200 transition hover:bg-teal-500/20"
                  >
                    Connect Tesla
                  </button>
                </div>
              </details>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
