import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../../services/teslaHealthService';
import Logo from '../Logo';

export default function Login({ onNavigate }) {
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaLogin = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  return (
    <div className="min-h-screen bg-[#1C1D21] text-white">
      {/* Navbar — 3 menus with RoboAgent brand exactly in the middle */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#1C1D21]/95 backdrop-blur-xl">
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

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Welcome back</h1>
          <p className="mt-3 text-xl text-white/70">
            Sign in with your Tesla account.
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

        {/* Email sign-in is disabled during beta — Tesla OAuth is the only authentication method. */}
        <p className="text-center text-sm text-white/50">
          During beta, sign-in uses your Tesla account. Email sign-in is coming soon.
        </p>

        <div className="mt-10 text-center text-sm text-white/60">
          Don’t have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-white hover:underline">
            Create one free
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
