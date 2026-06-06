import React from 'react';
import { getTeslaLoginUrl } from '../services/teslaHealthService';
import { verifyBetaInvite, acceptTeslaConsent } from '../services/betaCompliance';

export default function Landing({ onNavigate }) {
  const handleTeslaAuth = () => {
    verifyBetaInvite('RoboAgent-BETA');
    acceptTeslaConsent();
    const url = getTeslaLoginUrl('overview');
    window.location.replace(url);
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative bg-[#0a0a0a]">
      {/* Full screen background image shaping the entire screen */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 hidden md:block"
        style={{ backgroundImage: "url('/landingpage.png')" }}
      />

      {/* Navbar - desktop only, mobile has no top elements */}
      <nav className="fixed top-0 z-50 w-full hidden md:block">
        <div className="max-w-7xl mx-auto px-[1.9965rem] h-[6.655rem] flex items-center relative">
          {/* RoboAgent in far left top corner */}
          <div 
            onClick={() => onNavigate('landing')}
            className="absolute left-0 top-0 h-[6.655rem] flex items-center pl-[1.9965rem] cursor-pointer hover:opacity-90 transition text-[1.66375rem] font-semibold tracking-[-0.5px] z-10"
          >
            RoboAgent
          </div>

          {/* Centered menus */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[2.662rem] text-[1.164625rem] font-medium">
            <button 
              onClick={() => onNavigate('about')}
              className="hover:text-white/70 transition"
            >
              About
            </button>
            <button 
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-white/70 transition"
            >
              How it Works
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="hover:text-white/70 transition"
            >
              Sign In
            </button>
          </div>

          {/* Persona avatar (sign in) in far right top corner */}
          <div className="absolute right-0 top-0 h-[6.655rem] flex items-center pr-[1.9965rem] z-10">
            <button
              onClick={handleTeslaAuth}
              className="w-[2.662rem] h-[2.662rem] rounded-full border border-white hover:border-white/70 hover:bg-white/10 transition flex items-center justify-center text-white/80"
              aria-label="Sign in with Tesla"
            >
              <svg className="w-[60%] h-[60%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 0 0-16 0"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-[1.9965rem] pt-0 md:pt-[6.655rem] text-center relative z-10">
        {/* Desktop Hero - empty to show background logo in center */}
        <div className="hidden md:block" />
      </div>

      {/* Mobile bottom stacked buttons */}
      <div className="md:hidden px-4 pb-8 flex flex-col gap-4">
        <button
          onClick={() => onNavigate('login')}
          className="w-full py-4 border border-white text-white font-semibold rounded-2xl text-lg active:scale-[0.985] transition"
        >
          Sign In
        </button>
        <button
          onClick={() => onNavigate('signup')}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl text-lg active:scale-[0.985] transition"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
