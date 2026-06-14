import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import Logo from '../components/Logo';

export default function AddVehiclePanel({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        {/* Back to Dashboard */}
        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </button>

        {/* Logo */}
        <div className="flex items-center mb-10">
          <Logo className="h-10" onClick={() => onNavigate('overview')} />
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-[-1.5px] leading-none mb-4">
            Add Another Tesla / Cybercab
          </h1>
          <p className="text-xl text-white/70">
            Link an additional vehicle to your fleet. Same secure one-click Tesla OAuth process.
          </p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 mb-8 text-center">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
            <span className="text-5xl font-light">T</span>
          </div>
          <h3 className="text-2xl font-semibold mb-3">Tesla Fleet API</h3>
          <p className="text-white/70">
            Secure one-time connection for this additional vehicle.<br />
            Your credentials never leave Tesla.
          </p>
        </div>

        <button
          onClick={() => startTeslaOAuth('overview')}
          className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition flex items-center justify-center gap-3"
        >
          Connect Another Tesla
        </button>

        <p className="text-center text-white/50 text-sm mt-8">
          After approval, you'll return to your dashboard with the new vehicle added to your fleet.
        </p>
      </div>
    </div>
  );
}
