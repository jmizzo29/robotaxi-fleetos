import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../../services/teslaHealthService';
import LandingHeader from '../landing/LandingHeader';

export default function Login({ onNavigate }) {
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);
  const [oauthError, setOauthError] = useState('');

  const handleTeslaLogin = () => {
    setOauthError('');
    setIsTeslaLoading(true);
    const result = startTeslaOAuth('overview');
    if (result?.ok === false) {
      setIsTeslaLoading(false);
      setOauthError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-white">
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="flex items-center justify-center px-6 pb-12 pt-[4.75rem]">
      <div className="w-full max-w-[440px]">

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Welcome back</h1>
          <p className="mt-3 text-xl text-white/70">
            Sign in with your Tesla account.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTeslaLogin}
          disabled={isTeslaLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-5 text-lg font-semibold text-black transition hover:bg-white/90 active:scale-[0.985]"
        >
          {isTeslaLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Continue with Tesla Account'
          )}
        </button>
        {oauthError ? (
          <p className="mb-8 text-sm text-[#C45C4A]" role="alert">
            {oauthError}
          </p>
        ) : (
          <div className="mb-8" />
        )}

        <p className="text-center text-sm text-white/50">
          During beta, sign-in uses your Tesla account. Email sign-in is coming soon.
        </p>

        <div className="mt-10 text-center text-sm text-white/60">
          Don’t have an account?{' '}
          <button type="button" onClick={() => onNavigate('signup')} className="text-white hover:underline">
            Create one free
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
