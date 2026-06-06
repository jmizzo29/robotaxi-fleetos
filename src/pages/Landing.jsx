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
    <div className="min-h-screen text-white flex flex-col relative">
      {/* Full screen background image shaping the entire screen */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/landingpage.png')" }}
      />

      {/* Navbar - no banner, transparent over background */}
      <nav className="fixed top-0 z-50 w-full">
        {/* RoboAgent in far left top corner */}
        <div 
          onClick={() => onNavigate('landing')}
          className="absolute left-0 top-0 h-[3.85rem] md:h-[6.05rem] flex items-center pl-[1.1rem] md:pl-[1.815rem] cursor-pointer hover:opacity-90 transition text-[1.2375rem] md:text-[1.5125rem] font-semibold tracking-[-0.5px] z-10"
        >
          RoboAgent
        </div>

        <div className="max-w-7xl mx-auto px-[1.1rem] md:px-[1.815rem] h-[3.85rem] md:h-[6.05rem] flex items-center relative">
          {/* Centered menus */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[0.825rem] md:gap-[2.42rem] text-[0.825rem] md:text-[1.05875rem] font-medium">
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
              Sign
            </button>
          </div>
        </div>

        {/* Circle with T in far right top corner */}
        <div className="absolute right-0 top-0 h-[3.85rem] md:h-[6.05rem] flex items-center pr-[1.1rem] md:pr-[1.815rem] z-10">
          <button
            onClick={handleTeslaAuth}
            className="w-[1.65rem] h-[1.65rem] md:w-[2.42rem] md:h-[2.42rem] rounded-full border border-red-500 hover:border-red-400 hover:bg-white/10 transition flex items-center justify-center"
            aria-label="Authenticate with Tesla"
          >
            <span className="text-[9.9px] md:text-[12.1px] font-bold text-white/80">T</span>
          </button>
        </div>
      </nav>

      {/* Minimal Hero - empty, background is the entire screen */}
      <div className="flex-1 flex items-center justify-center px-[1.1rem] md:px-[1.815rem] pt-[3.85rem] md:pt-[6.05rem] text-center relative z-10">
        <div />
      </div>
    </div>
  );
}
