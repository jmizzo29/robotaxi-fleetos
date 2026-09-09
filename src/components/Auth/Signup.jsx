import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../../services/teslaHealthService';
import LandingHeader from '../landing/LandingHeader';

export default function Signup({ onNavigate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError, setOauthError] = useState('');

  const handleTeslaSignup = () => {
    setOauthError('');
    setIsLoading(true);
    const result = startTeslaOAuth('overview');
    if (result?.ok === false) {
      setIsLoading(false);
      setOauthError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-white">
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="flex items-center justify-center px-6 pb-12 pt-[4.75rem]">
      <div className="w-full max-w-[440px]">

        <h1 className="mb-4 text-5xl font-semibold tracking-[-2px]">Get started with your Teslas</h1>
        <p className="mb-12 text-2xl text-white/70">The fastest way is with your Tesla account.</p>

        <button
          type="button"
          onClick={handleTeslaSignup}
          disabled={isLoading}
          className="mb-4 flex w-full items-center justify-center gap-4 rounded-3xl bg-white py-6 text-2xl font-semibold text-black transition hover:bg-white/90 active:scale-[0.985]"
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            'Continue with Tesla Account'
          )}
        </button>
        {oauthError ? (
          <p className="mb-10 text-sm text-[#C45C4A]" role="alert">
            {oauthError}
          </p>
        ) : (
          <div className="mb-10" />
        )}

        <p className="text-center text-sm text-white/50">
          During beta, accounts are created with your Tesla account. Email sign-up is coming soon.
        </p>
      </div>
      </div>
    </div>
  );
}
