import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function Login({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        {/* Back to Home */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-90 transition"
        >
          <div className="font-bold text-4xl tracking-[-3px] text-white">RA</div>
          <div className="text-3xl font-semibold tracking-[-1px]">RoboAgent</div>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Welcome back</h1>
          <p className="mt-3 text-xl text-white/70">Sign in to manage your fleet.</p>
        </div>

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
            className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => onNavigate('login')} // change to real Tesla login later
            className="w-full border border-white/30 hover:bg-white/5 py-5 rounded-2xl text-lg font-semibold transition active:scale-[0.985]"
          >
            Continue with Tesla Account
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-white/60">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-white hover:underline"
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}
