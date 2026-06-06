import { useEffect, useState } from 'react';
import { ArrowRight, Battery, Car, CreditCard, Loader2, User } from 'lucide-react';
import { isClerkConfigured } from '../auth/clerkConfig';
import RoboLogo from '../components/RoboLogo';
import RoboWordmark from '../components/RoboWordmark';
import SignOutButton from '../components/SignOutButton';
import { Button, Card, Chip, Metric, StatusDot } from '../ui';
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

function initials(name, email) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function teslaStatusTone(session, billing) {
  if (!session?.teslaConnected) return 'offline';
  if ((billing?.vehicleCount || 0) > 0) return 'ready';
  return 'caution';
}

function teslaStatusLabel(session, billing) {
  if (!session?.teslaConnected) return 'Not connected';
  const count = billing?.vehicleCount || 0;
  if (count === 0) return 'Connected · awaiting first sync';
  return `Connected · ${count} vehicle${count === 1 ? '' : 's'} synced`;
}

function formatConnectedAt(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

function LoadingState() {
  return (
    <Card padding="p-6 sm:p-7" className="animate-fade-up">
      <div
        className="flex items-center justify-center gap-3 py-12 text-sm text-ink-muted"
        role="status"
        aria-live="polite"
      >
        <Spinner className="h-5 w-5 text-ink-muted" />
        Loading your account…
      </div>
    </Card>
  );
}

function SignedOutView({ clerkReady, authBusy, error, message, onSignIn, onCreateAccount }) {
  return (
    <div className="mx-auto w-full max-w-md animate-fade-up">
      <div className="flex flex-col items-center py-6 text-center sm:py-10">
        <RoboLogo className="h-14 w-14" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
          Sign in to RoboAgent
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
          One account for your fleet. Tesla connects right after.
        </p>
      </div>

      {(message || error) && (
        <div className="mb-5">
          <Notice tone={error ? 'error' : 'success'}>{error || message}</Notice>
        </div>
      )}

      <Card padding="p-6 sm:p-7">
        {clerkReady ? (
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={onSignIn}
              disabled={Boolean(authBusy)}
              aria-busy={authBusy === 'signin'}
            >
              {authBusy === 'signin' && <Spinner />}
              {authBusy === 'signin' ? 'Opening…' : 'Get started'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={onCreateAccount}
              disabled={Boolean(authBusy)}
              aria-busy={authBusy === 'create'}
            >
              {authBusy === 'create' ? 'Opening…' : 'Create account'}
            </Button>
          </div>
        ) : (
          <Notice tone="warning">
            Secure sign-in is not configured here. Use the live site with Clerk enabled, or add your Clerk publishable key.
          </Notice>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Tesla login is separate and comes next.
      </p>
    </div>
  );
}

function ProfileSection({ user, profileName, isBusy, onProfileNameChange, onSaveProfile, onOpenDashboard }) {
  return (
    <Card padding="p-5 sm:p-6" className="animate-fade-up">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink/5 text-sm font-semibold text-ink-muted"
          aria-hidden="true"
        >
          {initials(user.name, user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{user.name || 'RoboAgent owner'}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{user.email}</p>
          <Chip active className="mt-2 pointer-events-none">Signed in</Chip>
        </div>
      </div>

      <div className="mt-5 border-t border-ink/8 pt-5">
        <label htmlFor="account-display-name" className="mb-1.5 block text-xs font-medium text-ink-muted">
          Display name
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="account-display-name"
            value={profileName}
            onChange={(event) => onProfileNameChange(event.target.value)}
            placeholder="Your name"
            enterKeyHint="done"
            className="w-full rounded-2xl border border-ink/12 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-status-active/60 focus:ring-2 focus:ring-status-active/20"
          />
          <Button
            variant="secondary"
            disabled={isBusy}
            aria-busy={isBusy}
            onClick={onSaveProfile}
            className="shrink-0 sm:px-5"
          >
            {isBusy && <Spinner />}
            {isBusy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <Button size="lg" className="mt-5 w-full" onClick={onOpenDashboard}>
        Open dashboard
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function TeslaSection({
  session,
  billing,
  isBusy,
  confirmDisconnect,
  onManage,
  onConfirmDisconnect,
  onCancelDisconnect,
  onDisconnect,
}) {
  const tone = teslaStatusTone(session, billing);
  const label = teslaStatusLabel(session, billing);
  const connectedAt = formatConnectedAt(session?.teslaConnectedAt);

  return (
    <Card padding="p-5 sm:p-6" className="animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
            <Car className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Tesla connection</p>
            <p className="mt-0.5 text-xs text-ink-subtle">Official Fleet API · read-only</p>
          </div>
        </div>
        <StatusDot tone={tone} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {connectedAt && (
          <span className="text-xs text-ink-subtle">· since {connectedAt}</span>
        )}
      </div>

      {(billing?.vehicleCount || 0) > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <Battery className="h-3.5 w-3.5" />
          <span>{billing.vehicleCount} vehicle{billing.vehicleCount === 1 ? '' : 's'} on your plan</span>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={onManage}>
          {session?.teslaConnected ? 'Manage vehicles' : 'Connect Tesla'}
        </Button>
        {session?.teslaConnected && (
          confirmDisconnect ? (
            <div className="flex flex-1 gap-2">
              <Button variant="secondary" className="flex-1" disabled={isBusy} onClick={onCancelDisconnect}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={isBusy}
                aria-busy={isBusy}
                onClick={onDisconnect}
              >
                {isBusy && <Spinner />}
                {isBusy ? 'Disconnecting…' : 'Confirm'}
              </Button>
            </div>
          ) : (
            <Button variant="danger" className="flex-1" disabled={isBusy} onClick={onConfirmDisconnect}>
              Disconnect
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

function PlanSection({ billing }) {
  if (!billing) return null;

  const planLabel = billing.billingRequired ? 'Upgrade needed' : 'Free beta';
  const planTone = billing.billingRequired ? 'warning' : 'success';

  return (
    <Card padding="p-5 sm:p-6" className="animate-fade-up">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <CreditCard className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-ink">Plan & billing</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Plan" value={planLabel} tone={planTone} />
        <Metric label="Included" value={billing.includedVehicles || 1} hint="Teslas" />
        <Metric label="Synced" value={billing.vehicleCount || 0} tone="info" icon={Car} />
      </div>

      {billing.billingRequired && (
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          You have {billing.billableVehicles || 0} billable vehicle{(billing.billableVehicles || 0) === 1 ? '' : 's'} beyond your included limit.
        </p>
      )}
    </Card>
  );
}

function SessionSection({ onSignedOut }) {
  return (
    <Card padding="p-5 sm:p-6" className="animate-fade-up">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <User className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Session</p>
          <p className="mt-0.5 text-xs text-ink-subtle">Sign out of this device</p>
        </div>
      </div>

      <SignOutButton
        label="Sign out"
        onSignedOut={onSignedOut}
        className="mt-5 w-full rounded-2xl border border-ink/12 bg-surface px-5 py-3.5 text-center text-sm font-semibold text-ink-muted transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
        confirmClassName="mt-5 rounded-2xl border border-status-caution/20 bg-status-caution/5"
      />
    </Card>
  );
}

export default function AccountPanel({ onNavigate, embedded = false }) {
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
      await refresh();
      setMessage('Tesla access revoked. You can reconnect anytime from onboarding.');
      setConfirmDisconnect(false);
    } catch {
      setError('Could not disconnect right now. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignedOut = () => {
    setSession({ authenticated: false, user: {} });
    onNavigate?.('landing');
  };

  const content = !sessionLoaded ? (
    <LoadingState />
  ) : !hasRealAccount ? (
    <SignedOutView
      clerkReady={clerkReady}
      authBusy={authBusy}
      error={error}
      message={message}
      onSignIn={() => openClerkAuth('signin')}
      onCreateAccount={() => openClerkAuth('create')}
    />
  ) : (
    <div className="space-y-4 sm:space-y-5">
      {(message || error) && (
        <Notice tone={error ? 'error' : 'success'}>{error || message}</Notice>
      )}

      <ProfileSection
        user={user}
        profileName={profileName}
        isBusy={isBusy}
        onProfileNameChange={setProfileName}
        onSaveProfile={() => runAction(() => updateFleetOsProfile({ name: profileName }), 'Profile updated.')}
        onOpenDashboard={() => onNavigate?.('overview')}
      />

      <TeslaSection
        session={session}
        billing={billing}
        isBusy={isBusy}
        confirmDisconnect={confirmDisconnect}
        onManage={() => onNavigate?.('onboarding')}
        onConfirmDisconnect={() => setConfirmDisconnect(true)}
        onCancelDisconnect={() => setConfirmDisconnect(false)}
        onDisconnect={disconnectTesla}
      />

      <PlanSection billing={billing} />

      <SessionSection onSignedOut={handleSignedOut} />
    </div>
  );

  if (embedded) {
    return content;
  }

  const centerSignedOut = sessionLoaded && !hasRealAccount;

  return (
    <div className="min-h-screen bg-surface px-4 py-5 text-ink sm:px-6">
      <header className="mx-auto flex max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate?.('landing')}
          className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
        >
          <RoboLogo className="h-8 w-8" />
          <RoboWordmark className="text-base" />
        </button>
        <Button variant="ghost" size="sm" onClick={() => onNavigate?.('landing')}>
          Home
        </Button>
      </header>

      <main
        className={`mx-auto max-w-xl py-6 ${
          centerSignedOut ? 'flex min-h-[calc(100vh-92px)] items-center' : 'pb-10'
        }`}
      >
        {content}
      </main>
    </div>
  );
}
