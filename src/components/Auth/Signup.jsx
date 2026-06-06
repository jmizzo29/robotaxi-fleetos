import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function Signup({ onNavigate, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    setIsLoading(false);
    if (onSignupSuccess) onSignupSuccess();
    else onNavigate('onboarding');
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

        {/* Clean Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-90 transition"
        >
          <div className="font-bold text-4xl tracking-[-3px] text-white">RA</div>
          <div className="text-3xl font-semibold tracking-[-1px]">RoboAgent</div>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px] leading-none">
            Start earning with your Teslas
          </h1>
          <p className="mt-3 text-xl text-white/70">
            Create your account in under 60 seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs tracking-[1px] text-white/60 mb-2">FULL NAME</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Mitchell"
              className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs tracking-[1px] text-white/60 mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@teslaowner.com"
              className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs tracking-[1px] text-white/60 mb-2">PASSWORD</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-[1px] text-white/60 mb-2">CONFIRM PASSWORD</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-6 py-5 text-lg placeholder:text-white/40 focus:border-emerald-500 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm py-2">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Creating account...
              </>
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => onNavigate('login')}
            className="w-full border border-white/30 hover:bg-white/5 py-5 rounded-2xl text-lg font-semibold transition active:scale-[0.985]"
          >
            Continue with Tesla Account
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-white/60">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-white hover:underline"
          >
            Log in instead
          </button>
        </div>
      </div>
    </div>
  );
}
