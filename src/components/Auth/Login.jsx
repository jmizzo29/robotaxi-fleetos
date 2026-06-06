import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { verifyBetaInvite, acceptTeslaConsent } from '../../services/betaCompliance';
import { getTeslaLoginUrl } from '../../services/teslaHealthService';

export default function Login({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    if (onLoginSuccess) onLoginSuccess();
    else onNavigate('overview');
  };

  const handleTeslaLogin = async () => {
    setIsTeslaLoading(true);
    verifyBetaInvite('RoboAgent-BETA');
    acceptTeslaConsent();

    // Use Clerk's direct social auth for Tesla if available (this can launch the OAuth directly without the full sign-in form on many setups).
    // With the dark appearance configured, any Clerk UI will match the app's dark theme instead of white.
    try {
      if (window.Clerk?.signIn?.authenticateWithRedirect) {
        await window.Clerk.signIn.authenticateWithRedirect({
          strategy: 'oauth_tesla', // <-- Update this to the exact strategy name from your Clerk dashboard (check under Social connections or OAuth providers; often 'oauth_tesla' or a custom name)
          redirectUrl: window.location.origin + '/#/sso-callback',
          signInFallbackRedirectUrl: window.location.origin + '/#/overview',
        });
        return;
      }
    } catch (err) {
      console.warn('Clerk Tesla social direct failed (strategy may not be configured or not available on mobile), falling back to custom backend Tesla Fleet flow', err);
    }

    // Fallback to pure custom backend Tesla Fleet API OAuth (for vehicle data / telemetry consent)
    const url = getTeslaLoginUrl('overview');
    console.log('Redirecting to Tesla OAuth from login (custom flow):', url);
    window.location.replace(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center mb-10">
          <div className="text-3xl font-semibold tracking-[-0.8px]">RoboAgent</div>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Welcome back</h1>
          <p className="mt-3 text-xl text-white/70">
            Sign in with your Tesla account or email.
          </p>
        </div>

        {/* Primary Tesla Login */}
        <button
          onClick={handleTeslaLogin}
          disabled={isTeslaLoading}
          className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition mb-8 flex items-center justify-center gap-3"
        >
          {isTeslaLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Continue with Tesla Account"
          )}
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative text-center">
            <span className="bg-[#0a0a0a] px-4 text-white/50 text-sm">or</span>
          </div>
        </div>

        {/* Secondary Email Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs tracking-[1px] text-white/60 mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@teslaowner.com"
              className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs tracking-[1px] text-white/60 mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm py-2">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/10 border border-white/30 text-white py-5 rounded-2xl text-lg font-semibold hover:bg-white/5 active:scale-[0.985] transition"
          >
            {isLoading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="mt-10 text-center text-sm text-white/60">
          Don’t have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-white hover:underline">
            Create one free
          </button>
        </div>
      </div>
    </div>
  );
}
