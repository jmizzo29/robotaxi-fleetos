import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';
import { useEffect } from 'react';

export function ClerkAccountSummary() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-sky-400/25 bg-sky-400/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Secure Auth</p>
        <h2 className="mt-2 text-2xl font-black text-white">Sign in with Clerk</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          ROBOAGENT now uses Clerk for production-grade identity. Clerk handles hosted signup, login, session security, email verification, and passwordless options.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <button type="button" className="rounded-lg bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200">
              Create Secure Account
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button type="button" className="rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/15">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Signed In</p>
          <h2 className="mt-2 text-2xl font-black text-white">{user?.fullName || 'ROBOAGENT Owner'}</h2>
          <p className="mt-1 text-sm font-semibold text-emerald-100">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-black uppercase text-emerald-100">
            Clerk Secured
          </span>
          <UserButton />
        </div>
      </div>
    </div>
  );
}

export function ClerkOnboardingAuthStep({ onAuthChange }) {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    onAuthChange?.();
  }, [isSignedIn, onAuthChange]);

  if (isSignedIn) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        Signed in securely as {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'ROBOAGENT owner'}.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SignUpButton mode="modal">
        <button type="button" className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600">
          Create Secure Account
        </button>
      </SignUpButton>
      <SignInButton mode="modal">
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300">
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}
