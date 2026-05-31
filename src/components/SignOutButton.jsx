import { useState } from 'react';
import { logoutFleetOsAccount } from '../services/sessionService';

export default function SignOutButton({
  onSignedOut,
  className = '',
  confirmClassName = '',
  label = 'Sign out of this device',
  compact = false,
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear local session + compliance state (audit: fix sign-out races and stale consent)
      try { localStorage.removeItem('fleetos_tesla_consent'); } catch {}
      try { localStorage.removeItem('fleetos_beta_invite'); } catch {}
      try { sessionStorage.clear(); } catch {}

      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
      onSignedOut?.();
      // Force clean reload to landing to avoid any stale hybrid auth state
      if (typeof window !== 'undefined') {
        window.location.href = '/#/landing';
      }
    } finally {
      setIsSigningOut(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-3 ${confirmClassName}`}>
        <p className="text-sm font-black text-amber-950">Sign out?</p>
        {!compact && (
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
            You will need to sign in again to manage your fleet.
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isSigningOut}
            className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="rounded-xl bg-[#172231] px-3 py-2 text-xs font-black text-white transition hover:bg-[#243044] disabled:cursor-wait disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      disabled={isSigningOut}
      className={className}
    >
      {isSigningOut ? 'Signing out...' : label}
    </button>
  );
}
