import { useState } from 'react';
import { colors } from '../design/roboagentTokens';
import { clearLocalComplianceState } from '../services/betaCompliance';
import { logoutFleetOsAccount } from '../services/sessionService';

export default function SignOutButton({
  onSignedOut,
  className = '',
  confirmClassName = '',
  label = 'Sign out',
  compact = false,
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear local session + compliance state (audit: fix sign-out races and stale consent).
      // Uses the canonical keys from betaCompliance instead of legacy key names.
      clearLocalComplianceState();
      try { sessionStorage.clear(); } catch {}

      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
      onSignedOut?.();
      // Force a true reload at the landing route so no in-memory auth/fleet state
      // survives sign-out. Setting the hash alone would keep the SPA alive.
      if (typeof window !== 'undefined') {
        window.location.hash = '#/landing';
        window.location.reload();
      }
    } finally {
      setIsSigningOut(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div
        className={`rounded-[10px] border p-4 ${confirmClassName}`}
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        role="group"
        aria-label="Confirm sign out"
      >
        <p className="text-[15px] font-medium text-[#F3F3F1]">Sign out?</p>
        {!compact && (
          <p className="mt-1 text-[13px] font-normal leading-5 text-[#8B8E94]">
            You will need to sign in again to manage your fleet.
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isSigningOut}
            className="rounded-full border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-wait disabled:opacity-60"
            style={{ borderColor: colors.border, color: colors.navIdle, backgroundColor: 'transparent' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="rounded-full bg-white px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E0F12] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
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
      {isSigningOut ? 'Signing out…' : label}
    </button>
  );
}
