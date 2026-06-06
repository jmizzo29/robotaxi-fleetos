import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { verifyBetaInvite, acceptTeslaConsent } from '../../services/betaCompliance';
import { getTeslaLoginUrl } from '../../services/teslaHealthService';
import Logo from '../Logo';

export default function Signup({ onNavigate, onSignupSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTeslaSignup = async () => {
    setIsLoading(true);
    verifyBetaInvite('RoboAgent-BETA');
    acceptTeslaConsent();

    // Use Clerk's direct social auth for Tesla if available (this can launch the OAuth directly without the full sign-in form on many setups).
    // With the dark appearance configured, any Clerk UI will match the app's dark theme instead of white.
    try {
      if (window.Clerk?.signIn?.authenticateWithRedirect) {
        await window.Clerk.signIn.authenticateWithRedirect({
          strategy: 'oauth_tesla', // <-- Update this to the exact strategy name from your Clerk dashboard (check under Social connections or OAuth providers; often 'oauth_tesla' or a custom name)
          redirectUrl: window.location.origin + '/#/sso-callback',
          signInFallbackRedirectUrl: window.location.origin + '/#/onboarding',
        });
        return;
      }
    } catch (err) {
      console.warn('Clerk Tesla social direct failed (strategy may not be configured or not available on mobile), falling back to custom backend Tesla Fleet flow', err);
    }

    // Fallback to pure custom backend Tesla Fleet API OAuth (for vehicle data / telemetry consent)
    const url = getTeslaLoginUrl('onboarding'); // after success, lands on onboarding which auto-jumps to success
    console.log('Starting Tesla OAuth from signup (custom flow):', url);

    // Use replace so the user doesn't have the intermediate signup in history
    window.location.replace(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar — 3 menus with RoboAgent brand exactly in the middle */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center relative">
          {/* Left: one menu */}
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90 hover:text-white transition"
          >
            HOW IT WORKS
          </button>

          {/* EXACT MIDDLE: RoboAgent (you will provide the file) */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:opacity-90 transition"
            onClick={() => onNavigate('landing')}
          >
            <Logo className="h-7 sm:h-8" />
          </div>

          {/* Right: the other two menus */}
          <div className="ml-auto flex items-center gap-8 sm:gap-10 text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90">
            <button 
              onClick={() => onNavigate('login')}
              className="hover:text-white transition"
            >
              SIGN IN
            </button>
            <button 
              onClick={() => onNavigate('about')}
              className="hover:text-white transition"
            >
              ABOUT
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">

        <h1 className="text-5xl font-semibold tracking-[-2px] mb-4">Get started with your Teslas</h1>
        <p className="text-2xl text-white/70 mb-12">The fastest way is with your Tesla account.</p>

        {/* Primary Tesla Button */}
        <button
          onClick={handleTeslaSignup}
          disabled={isLoading}
          className="w-full bg-white text-black py-6 rounded-3xl text-2xl font-semibold hover:bg-white/90 active:scale-[0.985] transition mb-10 flex items-center justify-center gap-4"
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            "Continue with Tesla Account"
          )}
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative text-center text-white/50 text-sm">or continue with email</div>
        </div>

        {/* Secondary Email Option (smaller) */}
        <button
          onClick={() => onNavigate('signup-email')} // or handle email form
          className="w-full border border-white/30 hover:bg-white/5 py-5 rounded-2xl text-lg font-medium transition"
        >
          Sign up with Email
        </button>
      </div>
      </div>
    </div>
  );
}
