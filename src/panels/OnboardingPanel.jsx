import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { acceptTeslaConsent, canUseTeslaTelemetry, verifyBetaInvite } from '../services/betaCompliance';
import { getTeslaLoginUrl } from '../services/teslaHealthService';

export default function OnboardingPanel({ onNavigate }) {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // If consent is already present when this panel mounts (we just came back from the Tesla OAuth redirect),
  // immediately jump to the final success step instead of showing the "Connect" button again.
  useEffect(() => {
    if (canUseTeslaTelemetry()) {
      setStep(3);
    }
  }, []); // only on initial mount

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        {step < 3 && (
          <>
            {/* Back to Home */}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="font-bold text-4xl tracking-[-3px] text-white">RA</div>
              <div className="text-3xl font-semibold tracking-[-1px]">RoboAgent</div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mb-8">
              <div className="text-emerald-400 text-sm font-medium">BETA ONBOARDING</div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-white/50 text-sm">Step {step} of 3</div>
            </div>
          </>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-4xl font-semibold tracking-[-1.5px] leading-none mb-4">
              Connect Your First Tesla
            </h1>
            <p className="text-xl text-white/70 mb-10">
              Link your Tesla account to start managing your robotaxi fleet.
            </p>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 mb-8 text-center">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                <span className="text-5xl font-light">T</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Tesla Fleet API</h3>
              <p className="text-white/70">
                Secure one-time connection.<br />
                Your credentials never leave Tesla.
              </p>
            </div>

            <button
              onClick={() => {
                // Trigger the existing working Tesla OAuth flow
                verifyBetaInvite('RoboAgent-BETA');
                acceptTeslaConsent();
                const url = getTeslaLoginUrl('onboarding');
                console.log('Redirecting to Tesla OAuth:', url);
                // Use replace to clear history and avoid chrome-error frame issues from previous failed attempts
                window.location.replace(url);
              }}
              className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition flex items-center justify-center gap-3"
            >
              Connect Tesla Account
            </button>

            <p className="text-center text-white/50 text-sm mt-8">
              Takes about 30 seconds • You can add more vehicles later
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-[-1.5px] leading-none mb-6">
              Syncing Your Tesla
            </h1>
            <p className="text-xl text-white/70 mb-10">
              Pulling live telemetry, battery status, and location data...
            </p>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-8">
              <div className="h-full w-3/4 bg-emerald-400 rounded-full animate-pulse" />
            </div>

            <button
              onClick={nextStep}
              className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md text-center mx-auto">
            <div className="mx-auto mb-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400">
              <span className="text-7xl"></span>
            </div>

            <h1 className="text-5xl font-semibold tracking-[-2px] mb-6">You're all set!</h1>

            <p className="text-2xl text-emerald-400 mb-8">Your first Tesla is now connected.</p>

            <p className="text-xl text-white/80 mb-12 leading-tight">
              Welcome to the future of robotaxi fleet management.<br />
              Your vehicle is ready to start earning.
            </p>

            <button
              onClick={() => onNavigate('overview')}
              className="w-full bg-white text-black py-6 rounded-3xl text-2xl font-semibold hover:bg-white/90 active:scale-[0.985] transition shadow-2xl"
            >
              Go to My Dashboard
            </button>

            <p className="mt-10 text-sm text-white/50">
              You can add more vehicles anytime from the fleet settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
