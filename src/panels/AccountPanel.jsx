import { useEffect, useState } from 'react';
import { ArrowRight, Car, ChevronDown, Loader2 } from 'lucide-react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
import SignOutButton from '../components/SignOutButton';
import { Button, Card } from '../ui';
import {
  disconnectTeslaForUser,
  getFleetOsBillingStatus,
  getFleetOsSession,
  updateFleetOsProfile,
} from '../services/sessionService';

function Spinner({ className = '' }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} aria-hidden="true" />;
}

function Notice({ tone = 'success', children }) {
  const styles = {
    success: 'border-status-ready/20 bg-status-ready/5 text-status-ready',
    error: 'border-status-critical/20 bg-status-critical/5 text-status-critical',
    warning: 'border-status-caution/25 bg-status-caution/8 text-status-caution',
  };
  const assertive = tone === 'error' || tone === 'warning';
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ${styles[tone]}`}
    >
      {children}
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-3">
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

export default function AccountPanel({ onNavigate }) {
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [billing, setBilling] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

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

    setSessionLoaded(true);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh().catch(() => {
        setSession({ authenticated: false, user: {} });
        setSessionLoaded(true);
      });
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
      setError(actionError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const openClerkAuth = async (mode) => {
    setError('');
    setMessage('');

    if (!window.Clerk?.loaded) {
      setError('Account service is still loading. Try again in a moment.');
      return;
    }

    setAuthBusy(mode);
    try {
      const redirectUrl = `${window.location.origin}/#/onboarding`;
      const options = {
        fallbackRedirectUrl: redirectUrl,
        signInFallbackRedirectUrl: redirectUrl,
        signUpFallbackRedirectUrl: redirectUrl,
      };

      if (mode === 'create') {
        await window.Clerk.openSignUp(options);
      } else {
        await window.Clerk.openSignIn(options);
      }
    } catch (authError) {
      setError(authError?.message || 'Could not open the secure account window. Please try again.');
    } finally {
      setAuthBusy('');
    }
  };

  const disconnectTesla = async () => {
    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await disconnectTeslaForUser();
      setMessage('Tesla access revoked. You can reconnect anytime from onboarding.');
      setConfirmDisconnect(false);
    } catch {
      setError('Could not disconnect right now. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-5 text-ink">
      <header className="mx-auto flex max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate?.('landing')}
          className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
        >
          <RoboLogo className="h-8 w-8" />
          <RoboWordmark className="text-base" />
        </button>
        <Button variant="ghost" size="sm" onClick={() => onNavigate?.('landing')}>Home</Button>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-92px)] max-w-xl place-items-center py-5">
        {!sessionLoaded ? (
          <Card padding="p-6 sm:p-7" className="w-full animate-fade-up">
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-ink-muted" role="status" aria-live="polite">
              <Spinner className="h-5 w-5 text-ink-muted" />
              Loading your account…
            </div>
          </Card>
        ) : (
          <Card padding="p-6 sm:p-7" className="w-full animate-fade-up">
            <div className="mb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {hasRealAccount ? 'You are signed in' : 'Sign in to ROBOAGENT'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {hasRealAccount
                  ? 'Manage your owner account, plan, and Tesla connection.'
                  : 'Use your owner account first. Tesla connects right after.'}
              </p>
            </div>

            {(message || error) && (
              <div className="mb-5">
                <Notice tone={error ? 'error' : 'success'}>{error || message}</Notice>
              </div>
            )}

            {!hasRealAccount ? (
              <div className="space-y-3">
                {clerkReady ? (
                  <>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => openClerkAuth('signin')}
                      disabled={Boolean(authBusy)}
                      aria-busy={authBusy === 'signin'}
                    >
                      {authBusy === 'signin' && <Spinner />}
                      {authBusy === 'signin' ? 'Opening…' : 'Sign in'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => openClerkAuth('create')}
                      disabled={Boolean(authBusy)}
                      aria-busy={authBusy === 'create'}
                    >
                      {authBusy === 'create' && <Spinner />}
                      {authBusy === 'create' ? 'Opening…' : 'Create account'}
                    </Button>
                  </>
                ) : (
                  <Notice tone="warning">
                    Secure account sign-in is not configured in this environment. Use the live site with Clerk enabled, or add the Clerk publishable key before testing account creation.
                  </Notice>
                )}

                <p className="pt-1 text-center text-xs text-ink-subtle">
                  Tesla login is separate and comes next.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-ink/8 bg-surface p-4">
                  <p className="text-[11px] font-medium text-ink-muted">Signed in</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{user.name || 'ROBOAGENT Owner'}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{user.email}</p>
                </div>

                <Button size="lg" className="w-full" onClick={() => onNavigate?.('overview')}>
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <SignOutButton
                  label="Sign out"
                  onSignedOut={() => {
                    setSession({ authenticated: false, user: {} });
                    onNavigate?.('landing');
                  }}
                  className="w-full rounded-2xl border border-ink/12 bg-surface-raised px-5 py-3.5 text-center text-sm font-semibold text-ink-muted transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
                />

                <div className="rounded-2xl border border-ink/8 bg-surface-raised p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Car className="h-4 w-4 text-ink-muted" /> Tesla connection
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    Vehicles connect via the official Tesla Fleet API. You can disconnect anytime.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button className="flex-1" onClick={() => onNavigate?.('onboarding')}>
                      Manage / add vehicles
                    </Button>
                    {confirmDisconnect ? (
                      <div className="flex flex-1 gap-2">
                        <Button
                          variant="secondary"
                          className="flex-1"
                          disabled={isBusy}
                          onClick={() => setConfirmDisconnect(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-1"
                          disabled={isBusy}
                          aria-busy={isBusy}
                          onClick={disconnectTesla}
                        >
                          {isBusy && <Spinner />}
                          {isBusy ? 'Disconnecting…' : 'Confirm'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="danger"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() => setConfirmDisconnect(true)}
                      >
                        Disconnect all Teslas
                      </Button>
                    )}
                  </div>
                </div>

                <details className="group rounded-2xl border border-ink/8 bg-surface-raised p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30">
                    Account details
                    <ChevronDown className="h-4 w-4 text-ink-muted transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <MiniMetric label="Plan" value="Free" />
                      <MiniMetric label="Included" value={`${billing?.includedVehicles || 1} Tesla`} />
                      <MiniMetric label="Synced" value={billing?.vehicleCount || 0} />
                    </div>
                    <div>
                      <label htmlFor="account-display-name" className="mb-1.5 block text-sm font-medium text-ink-muted">
                        Display name
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="account-display-name"
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          placeholder="Display name"
                          enterKeyHint="done"
                          className="w-full rounded-2xl border border-ink/12 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-status-active/60 focus:ring-2 focus:ring-status-active/20"
                        />
                        <Button
                          variant="secondary"
                          disabled={isBusy}
                          aria-busy={isBusy}
                          onClick={() => runAction(() => updateFleetOsProfile({ name: profileName }), 'Profile updated.')}
                        >
                          {isBusy && <Spinner />}
                          {isBusy ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
