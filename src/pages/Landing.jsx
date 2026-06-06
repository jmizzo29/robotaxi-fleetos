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
            className="flex items-center cursor-pointer hover:opacity-90 transition"
          >
            <div className="text-2xl font-semibold tracking-[-0.8px]">RoboAgent</div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="text-white/70 hover:text-white transition">How it works</a>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button 
              onClick={() => onNavigate('login')}
              className="px-8 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-2xl transition"
            >
              Log in
            </button>
            <button 
              onClick={() => onNavigate('signup')}
              className="px-8 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-white/90 active:scale-[0.985] transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-28 pb-24 px-6 flex items-center min-h-[90vh] relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950 px-6 py-1.5 mb-10 text-sm text-emerald-400 font-medium tracking-wider">
            READY FOR 2026 ROBOTAXI LAUNCH
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[82px] font-semibold tracking-[-3.8px] leading-none mb-8">
            Turn your Teslas<br />into a Robotaxi fleet.
          </h1>

          <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
            Tesla now allows owners to add their vehicles to the Robotaxi network.<br />
            Sign up with your Tesla account in one click and start earning.
          </p>

          <button
            onClick={() => onNavigate('signup')}
            className="group flex items-center justify-center gap-3 bg-white text-black px-12 py-6 rounded-2xl text-2xl font-semibold hover:bg-white/90 active:scale-[0.985] transition-all mx-auto shadow-xl shadow-black/50"
          >
            Get Started Free with Tesla
            <ArrowRight className="group-hover:translate-x-1 transition" />
          </button>

          <p className="mt-8 text-sm text-white/50">First 3 vehicles free • No password required</p>
        </div>
      </div>

      {/* New About / How it Works Section */}
      <div id="how">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-semibold tracking-[-2px] mb-6">How RoboAgent Works with Tesla Robotaxi</h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              In 2026, Tesla is opening its Robotaxi network to individual owners.
              You can now put your Tesla (or future Cybercab) to work earning money autonomously.
            </p>
          </div>

          {/* Telemetry Section */}
          <div className="bg-zinc-900 rounded-3xl p-12 mb-16">
            <h3 className="text-2xl font-semibold mb-8">What Telemetry We Fetch from Tesla</h3>
            
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
              <div>
                <strong className="text-emerald-400">Real-time Data:</strong>
                <ul className="mt-4 space-y-3 text-white/80">
                  <li>• Battery level &amp; range</li>
                  <li>• Current location &amp; speed</li>
                  <li>• Charging status &amp; power</li>
                  <li>• Vehicle status (driving, parked, charging)</li>
                </ul>
              </div>
              <div>
                <strong className="text-emerald-400">Fleet &amp; Health Data:</strong>
                <ul className="mt-4 space-y-3 text-white/80">
                  <li>• Energy consumption &amp; efficiency</li>
                  <li>• Software version &amp; update status</li>
                  <li>• Tire pressure &amp; basic diagnostics</li>
                  <li>• Odometer &amp; trip history</li>
                </ul>
              </div>
            </div>

            <p className="mt-12 text-white/70 text-center text-lg">
              All data is fetched securely through Tesla’s official Fleet API.<br />
              Your credentials never leave Tesla’s servers.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-4xl mb-4">1</div>
              <h3 className="text-2xl font-semibold mb-3">Connect Your Tesla</h3>
              <p className="text-white/70">One-click secure connection using Tesla Fleet API. Your credentials never leave Tesla.</p>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-4xl mb-4">2</div>
              <h3 className="text-2xl font-semibold mb-3">Opt into Robotaxi Network</h3>
              <p className="text-white/70">Tesla handles the autonomous driving. You decide when your car is available to earn.</p>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-4xl mb-4">3</div>
              <h3 className="text-2xl font-semibold mb-3">RoboAgent Manages Everything</h3>
              <p className="text-white/70">AI dispatching, charging optimization, earnings tracking, maintenance alerts — all in one place.</p>
            </div>
          </div>

          {/* Scenarios */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Individual Owner */}
            <div className="bg-zinc-900 rounded-3xl p-10">
              <h3 className="text-2xl font-semibold mb-6">Individual Owner (1–5 vehicles)</h3>
              <p className="text-white/70 mb-8">
                Use your Tesla on Turo or for personal use, then let it earn on the Robotaxi network when idle.
              </p>
              <div className="text-emerald-400 text-sm font-medium">RoboAgent helps you:</div>
              <ul className="mt-4 space-y-2 text-white/70">
                <li>• Balance personal use vs. robotaxi earnings</li>
                <li>• Get smart charging and pricing suggestions</li>
                <li>• Track total income from both Turo and Robotaxi</li>
              </ul>
            </div>

            {/* Fleet Owner */}
            <div className="bg-zinc-900 rounded-3xl p-10">
              <h3 className="text-2xl font-semibold mb-6">Fleet Owner (10+ Cybercabs)</h3>
              <p className="text-white/70 mb-8">
                Run a professional operation with multiple vehicles working 24/7.
              </p>
              <div className="text-emerald-400 text-sm font-medium">RoboAgent helps you:</div>
              <ul className="mt-4 space-y-2 text-white/70">
                <li>• AI-powered dispatching and routing</li>
                <li>• Centralized charging and maintenance scheduling</li>
                <li>• Detailed earnings analytics and optimization</li>
              </ul>
            </div>
          </div>

          <p className="mt-16 text-center text-white/60 text-lg">
            RoboAgent is built specifically for Tesla owners who want to maximize earnings with minimal effort in the new Robotaxi economy.
          </p>
        </div>
      </div>
    </div>
  );
}
