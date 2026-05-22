import { useEffect, useState } from 'react';
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

function StatusCard({ label, value, detail, tone = 'sky' }) {
  const tones = {
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 opacity-80">{detail}</p> : null}
    </div>
  );
}

export default function AccountPanel() {
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

  const refresh = async () => {
    const [nextSession, nextBilling] = await Promise.all([
      getFleetOsSession(),
      getFleetOsBillingStatus(),
    ]);
    setSession(nextSession);
    setBilling(nextBilling.billing);
    setProfileName(nextSession.user?.name || '');
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

  return (
    <div className="space-y-6">
      {isClerkConfigured() && <ClerkAccountSummary />}

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

      <section className="grid gap-4 xl:grid-cols-4">
        <StatusCard
          label="Identity"
          value={hasRealAccount ? 'Account' : 'Guest'}
          detail={hasRealAccount ? user.email : 'Create an account before inviting beta users or connecting paid vehicles.'}
          tone={hasRealAccount ? 'emerald' : 'amber'}
        />
        <StatusCard
          label="Plan"
          value="First Tesla Free"
          detail={`${billing?.vehicleCount || 0} synced vehicle${billing?.vehicleCount === 1 ? '' : 's'} tracked against this account.`}
        />
        <StatusCard
          label="Included"
          value={`${billing?.includedVehicles || 1} Tesla`}
          detail="The first Tesla is included during beta."
          tone="emerald"
        />
        <StatusCard
          label="Billable"
          value={billingRequired ? `${billing?.billableVehicles || 0} vehicle(s)` : 'None'}
          detail={billingRequired ? 'Additional vehicles need a paid plan before production launch.' : 'No billing action required.'}
          tone={billingRequired ? 'amber' : 'emerald'}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Beta Access</p>
            <h2 className="mt-2 text-2xl font-black text-slate-100">{isClerkConfigured() ? 'Native Backup Account' : 'Create Account'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isClerkConfigured()
                ? 'Clerk is the primary login path. This native beta account remains as a fallback until all tester data has migrated.'
                : 'Invite-only signup gives each tester a real FleetOS identity, a private Tesla OAuth connection, and first-Tesla-free billing status.'}
            </p>
          </div>

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
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(
              () => registerFleetOsAccount(registerForm),
              'Account created. This browser is now signed in.',
            )}
            className="mt-5 w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            Create FleetOS Account
          </button>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Returning Owner</p>
            <h2 className="mt-2 text-2xl font-black text-slate-100">Sign In</h2>
          </div>

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
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(
              () => loginFleetOsAccount(loginForm),
              'Signed in successfully.',
            )}
            className="mt-5 w-full rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            Sign In
          </button>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Passwordless</p>
          <h2 className="mt-2 text-2xl font-black text-slate-100">Magic Link</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            FleetOS can generate passwordless sign-in links now. Email delivery is still manual for beta until an email provider is connected.
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
              onClick={() => runAction(async () => {
                const result = await requestFleetOsMagicLink({ email: magicEmail });
                setMagicLink(result.magicLink);
              }, 'Magic link generated for beta testing.')}
              className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
            >
              Generate Link
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
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Profile</p>
          <h2 className="mt-2 text-2xl font-black text-slate-100">Account Details</h2>
          <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Email</span>
              <span className="text-right font-bold text-slate-100">{user.email || 'Guest session'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Role</span>
              <span className="font-bold text-slate-100">{user.role || 'owner'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Tesla coverage</span>
              <span className="font-bold text-slate-100">{billing?.coveredVehicles || 1} covered</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Display name"
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runAction(
                () => updateFleetOsProfile({ name: profileName }),
                'Profile updated.',
              )}
              className="rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
            >
              Save
            </button>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(
              () => logoutFleetOsAccount(),
              'Signed out on this browser.',
            )}
            className="mt-4 w-full rounded-lg border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-wait disabled:opacity-60"
          >
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}
