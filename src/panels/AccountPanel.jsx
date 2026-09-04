import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Battery,
  Car,
  CreditCard,
  Gauge,
  Loader2,
  MapPin,
  Shield,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
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
import { logTeslaDisconnect } from '../services/teslaDisconnectUtils';

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

function teslaStatusTone(session, billing, disconnectState = 'idle') {
  if (disconnectState === 'disconnecting') return 'caution';
  if (disconnectState === 'failed') return 'critical';
  if (disconnectState === 'disconnected' || !session?.teslaConnected) return 'offline';
  if ((billing?.vehicleCount || 0) > 0) return 'ready';
  return 'caution';
}

function teslaStatusLabel(session, billing, disconnectState = 'idle') {
  if (disconnectState === 'disconnecting') return 'Disconnecting…';
  if (disconnectState === 'failed') return 'Disconnect failed';
  if (disconnectState === 'disconnected') return 'Disconnected';
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

function PreviewGlowDot({ left, top, tone = 'ready', delay = '0s' }) {
  const color = tone === 'ready' ? '#10b981' : '#f59e0b';
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-60"
        style={{ backgroundColor: color, animationDelay: delay }}
      />
      <span
        className="relative block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px 3px ${color}99` }}
      />
    </span>
  );
}

function FleetPreviewCard() {
  const gridStyle = {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-status-ready/12 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-ink/30">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-[#161d2b] to-[#0d1117] px-4 py-3">
          <div className="flex items-center gap-2">
            <RoboLogo className="h-6 w-6 text-white" />
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">Fleet Command</p>
              <p className="text-[10px] text-white/40">3 vehicles · live sync</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ready/30 bg-status-ready/10 px-2.5 py-1 text-[10px] font-medium text-status-ready">
            <StatusDot tone="ready" pulse />
            Live
          </span>
        </div>

        <div className="relative min-h-[168px] overflow-hidden bg-[#0a0e16] sm:min-h-[200px]">
          <div className="absolute inset-0" style={gridStyle} />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-ready/15 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M18 38 Q38 48 56 54 T78 32"
              fill="none"
              stroke="rgba(16,185,129,0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <PreviewGlowDot left="24%" top="36%" delay="0s" />
          <PreviewGlowDot left="52%" top="54%" delay="0.5s" />
          <PreviewGlowDot left="72%" top="30%" tone="caution" delay="1s" />
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-status-ready" />
            Orlando metro
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-1.5 text-white/45">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[9px] font-medium uppercase tracking-[0.12em]">Earnings</span>
            </div>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">$12.4k</p>
            <p className="text-[10px] font-medium text-status-ready">+18% week</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-1.5 text-white/45">
              <Gauge className="h-3 w-3" />
              <span className="text-[9px] font-medium uppercase tracking-[0.12em]">Ready</span>
            </div>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">82%</p>
            <p className="text-[10px] font-medium text-status-ready">all vehicles</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-white/10 bg-status-ready/[0.06] px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-status-ready/15 text-status-ready">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-white/80">
            AI plan ready — charge Fleet 2 at 2:15 AM
          </p>
        </div>
      </div>
    </div>
  );
}

const TRUST_LINES = [
  { Icon: Shield, text: 'Official Tesla Fleet API — your password stays with Tesla' },
  { Icon: Car, text: 'One owner account for every vehicle you connect' },
  { Icon: Sparkles, text: 'Free beta — no card required to start' },
];

function SignedOutView({
  clerkReady,
  authBusy,
  error,
  message,
  onSignIn,
  onCreateAccount,
  onContinueToOnboarding,
}) {
  return (
    <div className="animate-fade-up">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface-raised/80 px-3 py-1.5 text-xs font-medium text-ink-muted shadow-sm backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-status-ready" />
            Tesla Fleet API · Privacy-first · Beta
          </span>

          <h1 className="mt-6 text-[2rem] font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Your fleet.
            <span className="mt-1 block text-ink-muted">One login.</span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
            Run your Teslas from one place — connect, sync, and manage without jumping between apps.
          </p>

          {(message || error) && (
            <div className="mt-5 max-w-md">
              <Notice tone={error ? 'error' : 'success'}>{error || message}</Notice>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {clerkReady ? (
              <>
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={onCreateAccount}
                  disabled={Boolean(authBusy)}
                  aria-busy={authBusy === 'create'}
                >
                  {authBusy === 'create' && <Spinner />}
                  {authBusy === 'create' ? 'Opening…' : 'Get started'}
                  {authBusy !== 'create' && <ArrowRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onSignIn}
                  disabled={Boolean(authBusy)}
                  aria-busy={authBusy === 'signin'}
                >
                  {authBusy === 'signin' ? 'Opening…' : 'Sign in'}
                </Button>
              </>
            ) : (
              <Button size="lg" className="rounded-full px-8" onClick={onContinueToOnboarding}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ul className="mt-8 max-w-md space-y-3 border-t border-ink/8 pt-6">
            {TRUST_LINES.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-status-ready/80" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:pl-2">
          <FleetPreviewCard />
        </div>
      </div>

      {import.meta.env.DEV && !clerkReady && (
        <p className="mt-10 text-center text-[11px] leading-relaxed text-ink-subtle">
          Dev: add <span className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</span> to{' '}
          <span className="font-mono">.env</span> for secure sign-in.
        </p>
      )}
    </div>
  );
}

function ProfileSection({ user, profileName, isBusy, onProfileNameChange, onSaveProfile, onOpenDashboard, onOpenSettings }) {
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
          <p className="text-sm font-semibold text-ink">{user.name || 'ROBOAGENT owner'}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{user.email || 'Signed in with Tesla'}</p>
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
      <Button variant="secondary" className="mt-2 w-full" onClick={onOpenSettings}>
        Settings &amp; feedback
      </Button>
    </Card>
  );
}

function TeslaSection({
  session,
  billing,
  disconnectState,
  confirmDisconnect,
  onManage,
  onConfirmDisconnect,
  onCancelDisconnect,
  onDisconnect,
}) {
  const isDisconnecting = disconnectState === 'disconnecting';
  const showConnected = Boolean(session?.teslaConnected) && disconnectState !== 'disconnected';
  const tone = teslaStatusTone(session, billing, disconnectState);
  const label = teslaStatusLabel(session, billing, disconnectState);
  const connectedAt = showConnected ? formatConnectedAt(session?.teslaConnectedAt) : null;

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
        <Button className="flex-1" onClick={onManage} disabled={isDisconnecting}>
          {showConnected ? 'Manage vehicles' : 'Connect Tesla'}
        </Button>
        {showConnected && (
          confirmDisconnect ? (
            <div className="flex flex-1 gap-2">
              <Button variant="secondary" className="flex-1" disabled={isDisconnecting} onClick={onCancelDisconnect}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={isDisconnecting}
                aria-busy={isDisconnecting}
                onClick={onDisconnect}
              >
                {isDisconnecting && <Spinner />}
                {isDisconnecting ? 'Disconnecting…' : 'Confirm'}
              </Button>
            </div>
          ) : (
            <Button variant="danger" className="flex-1" disabled={isDisconnecting} onClick={onConfirmDisconnect}>
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
        className="mt-5 w-full min-h-12 rounded-full border border-[rgba(91,168,160,0.18)] bg-[#25262B] px-5 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-[#F3F3F1] transition hover:bg-[#2C2D33] disabled:cursor-wait disabled:opacity-60"
        confirmClassName="mt-5"
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
  const [teslaDisconnectState, setTeslaDisconnectState] = useState('idle');

  const clerkReady = isClerkConfigured();
  const user = session?.user || {};
  // A valid session is signed in regardless of email — Tesla OAuth sessions
  // intentionally have user.email = null but must still reach account controls.
  const isSignedIn = Boolean(session?.authenticated);

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

  useEffect(() => {
    if (session?.teslaConnected) {
      setTeslaDisconnectState('idle');
    }
  }, [session?.teslaConnected]);

  useEffect(() => {
    const onTeslaDisconnected = () => {
      setSession((current) => (
        current ? { ...current, teslaConnected: false, teslaConnectedAt: null } : current
      ));
      setTeslaDisconnectState('disconnected');
      logTeslaDisconnect('local_cleanup', { source: 'fleetos-tesla-disconnected' });
    };

    window.addEventListener('fleetos-tesla-disconnected', onTeslaDisconnected);
    return () => window.removeEventListener('fleetos-tesla-disconnected', onTeslaDisconnected);
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
    logTeslaDisconnect('click', { surface: 'account' });
    setTeslaDisconnectState('disconnecting');
    setError('');
    setMessage('');

    try {
      const result = await disconnectTeslaForUser();
      setSession((current) => (
        current ? { ...current, teslaConnected: false, teslaConnectedAt: null } : current
      ));
      setTeslaDisconnectState('disconnected');
      setConfirmDisconnect(false);
      setMessage(result.message || 'Connection removed.');
      logTeslaDisconnect('ui_success', {
        hadActiveConnection: result.hadActiveConnection,
        teslaConnected: false,
      });
      await refresh();
    } catch (disconnectError) {
      setTeslaDisconnectState('failed');
      setError(disconnectError.message || 'Unable to remove the Tesla connection. Try again.');
      logTeslaDisconnect('ui_failure', { message: disconnectError.message });
    }
  };

  const handleSignedOut = () => {
    setSession({ authenticated: false, user: {} });
    onNavigate?.('landing');
  };

  const content = !sessionLoaded ? (
    <LoadingState />
  ) : !isSignedIn ? (
    <SignedOutView
      clerkReady={clerkReady}
      authBusy={authBusy}
      error={error}
      message={message}
      onSignIn={() => openClerkAuth('signin')}
      onCreateAccount={() => openClerkAuth('create')}
      onContinueToOnboarding={() => onNavigate?.('onboarding')}
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
        onOpenSettings={() => onNavigate?.('settings')}
      />

      <SessionSection onSignedOut={handleSignedOut} />

      <TeslaSection
        session={session}
        billing={billing}
        disconnectState={teslaDisconnectState}
        confirmDisconnect={confirmDisconnect}
        onManage={() => onNavigate?.('onboarding')}
        onConfirmDisconnect={() => setConfirmDisconnect(true)}
        onCancelDisconnect={() => setConfirmDisconnect(false)}
        onDisconnect={disconnectTesla}
      />

      <PlanSection billing={billing} />
    </div>
  );

  if (embedded) {
    return content;
  }

  const isSignedOut = sessionLoaded && !isSignedIn;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-status-ready/8 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-[320px] w-[320px] rounded-full bg-status-active/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[260px] w-[380px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <header className="relative sticky top-0 z-50 border-b border-ink/8 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate?.('landing')}
            className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active/30"
            aria-label="ROBOAGENT home"
          >
            <RoboLogo className="h-8 w-8" />
            <RoboWordmark variant="calm" className="text-base" colorClass="text-ink" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('landing')}>
            Home
          </Button>
        </div>
      </header>

      <main
        className={`relative mx-auto px-4 py-8 sm:px-6 sm:py-10 ${
          isSignedOut ? 'max-w-6xl' : 'max-w-xl pb-10'
        }`}
      >
        {content}
      </main>
    </div>
  );
}
