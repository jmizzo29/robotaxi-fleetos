import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Landing({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
          >
            <div className="font-bold text-3xl tracking-[-2.5px] text-white">RA</div>
            <div className="text-2xl font-semibold tracking-[-0.6px]">RoboAgent</div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#product" className="text-white/70 hover:text-white transition">Product</a>
            <a href="#how" className="text-white/70 hover:text-white transition">How it works</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('signup')}
              className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-white/90 transition active:scale-[0.98]"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="px-6 py-2 text-sm text-white/80 hover:text-white transition"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-20 px-6 flex items-center min-h-[90vh]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950 px-6 py-1.5 mb-10 text-sm text-emerald-400 font-medium tracking-wider">
            READY FOR 2026 ROBOTAXI LAUNCH
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[80px] font-semibold tracking-[-3.8px] leading-none mb-8">
            Turn your Teslas<br />into a Robotaxi fleet.
          </h1>

          <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
            The simplest fleet management for Tesla owners and operators.
          </p>

          <button
            onClick={() => onNavigate('signup')}
            className="group flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-xl font-semibold hover:bg-white/90 active:scale-[0.985] transition-all mx-auto"
          >
            Get Started Free in Beta
            <ArrowRight className="group-hover:translate-x-1 transition" />
          </button>

          <p className="mt-8 text-sm text-white/50">First 3 vehicles free • No card required</p>
        </div>
      </div>
    </div>
  );
}
