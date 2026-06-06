import React from 'react';
import SignOutButton from '../components/SignOutButton';

export default function CommandDashboard({ onNavigate = () => {}, route = 'overview', fleet = [] }) {
  const totalVehicles = fleet.length;
  const onlineVehicles = fleet.filter(v => {
    const s = (v.status || '').toUpperCase();
    return !s.includes('OFFLINE');
  }).length || totalVehicles;

  const totalEarnings = fleet.reduce((sum, v) => sum + (v.revenue || 0), 0);

  const formatDollars = (amount) => {
    const num = Math.round(amount || 0);
    return '$' + num.toLocaleString();
  };

  // Sidebar nav items with route mapping for integration
  const navItems = [
    { label: "Home", route: 'overview' },
    { label: "Live Map", route: 'map' },
    { label: "Fleet", route: 'fleet' },
    { label: "AI Agent", route: 'ai' },
    { label: "Earnings", route: 'finance' },
    { label: "Charging", route: 'charging' },
    { label: "Settings", route: 'settings' },
  ];

  const isActive = (itemRoute) => {
    if (itemRoute === 'overview' && (route === 'overview' || !route)) return true;
    return route === itemRoute;
  };

  const handleNavClick = (itemRoute) => {
    onNavigate(itemRoute);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Left Sidebar - Kept */}
      <div className="w-72 border-r border-white/10 bg-[#0a0a0a] flex-shrink-0 flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/10">
            <div className="font-bold text-3xl tracking-[-2.5px] text-white">RA</div>
            <div>
              <div className="text-2xl font-semibold tracking-[-0.8px]">RoboAgent</div>
              <div className="text-[10px] text-emerald-400 -mt-1">TESLA FLEET OS</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => handleNavClick(item.route)}
                className={`px-5 py-3.5 rounded-2xl text-lg font-medium cursor-pointer transition ${
                  isActive(item.route) ? 'bg-white text-black' : 'hover:bg-white/5'
                }`}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* Sign out button at bottom of sidebar */}
        <div className="p-6 border-t border-white/10">
          <SignOutButton
            onSignedOut={() => onNavigate('landing')}
            className="w-full text-left text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-2xl px-5 py-3 transition"
            label="Sign out"
            compact
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:p-12">
        <div className="max-w-screen-2xl mx-auto">
          <h1 className="text-5xl font-semibold tracking-[-2px] mb-2">Good morning, John</h1>
          <p className="text-white/70 text-xl">Here's what's happening with your fleet today.</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-sm">TODAY'S EARNINGS</div>
              <div className="text-5xl font-semibold mt-3">
                {formatDollars(totalEarnings)}
              </div>
            </div>
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-sm">VEHICLES ONLINE</div>
              <div className="text-5xl font-semibold mt-3">
                {onlineVehicles}/{totalVehicles}
              </div>
            </div>
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-sm">AVG BATTERY</div>
              <div className="text-5xl font-semibold mt-3">
                {fleet.length > 0 
                  ? Math.round(fleet.reduce((sum, v) => sum + (v.battery || v.battery_level || 0), 0) / fleet.length)
                  : 0}%
              </div>
            </div>
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="text-emerald-400 text-sm">AI ACTIONS</div>
              <div className="text-5xl font-semibold mt-3">3</div>
            </div>
          </div>

          {/* AI Bar */}
          <div className="mt-12 bg-zinc-900 rounded-3xl p-2">
            <div className="flex items-center gap-4 bg-[#0a0a0a] rounded-3xl px-6 py-5">
              <div className="text-emerald-400">✦</div>
              <input 
                type="text" 
                placeholder="Ask anything... e.g. 'What's the best charging plan for tonight?'" 
                className="flex-1 bg-transparent outline-none text-lg placeholder:text-white/50"
              />
              <button className="bg-white text-black px-8 py-3 rounded-2xl font-medium">Send</button>
            </div>
          </div>

          {/* Fleet Cards - show all vehicles */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Your Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fleet.length > 0 ? (
                fleet.map((vehicle, i) => {
                  const name = vehicle.display_name || vehicle.id || `Vehicle-${i + 1}`;
                  const battery = Math.round(vehicle.battery || vehicle.battery_level || 0);
                  const earnings = Math.round(vehicle.revenue || 0);

                  // Derive a simple status label + color
                  const rawStatus = (vehicle.status || '').toUpperCase();
                  let statusText = 'ONLINE';
                  let statusColor = 'text-emerald-400';

                  if (rawStatus.includes('CHARGE') || battery < 25) {
                    statusText = 'CHARGING';
                    statusColor = 'text-amber-400';
                  } else if (rawStatus.includes('SERVICE') || rawStatus.includes('PICK') || rawStatus.includes('REPOS')) {
                    statusText = 'IN SERVICE';
                    statusColor = 'text-emerald-400';
                  }

                  return (
                    <div 
                      key={vehicle.id || i} 
                      onClick={() => onNavigate('fleet')}
                      className="bg-zinc-900 rounded-3xl p-8 hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono text-xl">{name}</div>
                          <div className={`${statusColor} text-sm mt-1`}>● {statusText}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-semibold">{battery}<span className="text-sm">%</span></div>
                        </div>
                      </div>
                      <div className="mt-8 text-3xl font-medium">{formatDollars(earnings)} today</div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-white/60">No vehicles yet. Connect your first Tesla.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
