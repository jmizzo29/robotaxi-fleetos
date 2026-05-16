export default function App() {
  const fleet = [
    {
      id: 'CAR-001',
      name: 'Mitchell Family Model X',
      model: '2016 Tesla Model X',
      battery: 78,
      status: 'ONLINE',
      revenue: 4822,
      today: 248,
      utilization: 72,
      miles: 134,
      location: 'Lakeland Zone',
      ai: 'Airport demand projected +22% tomorrow morning.'
    },
    {
      id: 'CAR-002',
      name: 'Tesla Model Y',
      model: 'Robotaxi Fleet Vehicle',
      battery: 92,
      status: 'CHARGING',
      revenue: 3910,
      today: 192,
      utilization: 64,
      miles: 88,
      location: 'Orlando Zone',
      ai: 'Charging optimized for off-peak energy rates.'
    },
    {
      id: 'CAR-003',
      name: 'Tesla Cybercab',
      model: 'Autonomous Fleet Unit',
      battery: 55,
      status: 'IN SERVICE',
      revenue: 6201,
      today: 321,
      utilization: 81,
      miles: 172,
      location: 'Tampa Zone',
      ai: 'High event demand detected downtown.'
    }
  ]

  const totalRevenue = fleet.reduce(
    (sum, vehicle) => sum + vehicle.revenue,
    0
  )

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[260px] border-r border-cyan-500/10 bg-black/20 flex-col p-6">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>

            <span className="text-cyan-300 uppercase tracking-[0.3em] text-xs">
              FleetOS
            </span>
          </div>

          <h1 className="text-3xl font-black leading-tight">
            Robotaxi
            <span className="block text-cyan-300">
              Mission Control
            </span>
          </h1>
        </div>

        <nav className="space-y-2">
          {[
            'Operations',
            'Fleet',
            'Dispatch',
            'Revenue',
            'Charging',
            'Maintenance',
            'AI Insights'
          ].map((item, i) => (
            <div
              key={item}
              className={`px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                i === 0
                  ? 'bg-cyan-500/15 border border-cyan-500/20 text-cyan-300'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {item}
            </div>
          ))}
        </nav>

        <div className="mt-auto bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5">
          <p className="uppercase tracking-[0.25em] text-cyan-300 text-[10px] mb-2">
            Fleet Intelligence
          </p>

          <h3 className="text-3xl font-black mb-2">
            84%
          </h3>

          <p className="text-sm text-slate-300">
            AI predicts Orlando airport demand spike tomorrow morning.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-[1700px] mx-auto">

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>

              <span className="uppercase tracking-[0.3em] text-green-300 text-xs">
                Fleet Live
              </span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black mb-4 leading-none">
              Autonomous Fleet
              <span className="block text-cyan-300">
                Operations Center
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-3xl">
              AI-assisted operating system for autonomous Tesla fleet management.
            </p>
          </header>

          {/* KPI Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
              <p className="text-slate-500 text-xs uppercase mb-2">
                Active Vehicles
              </p>

              <h2 className="text-4xl font-black text-cyan-300">
                3
              </h2>
            </div>

            <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
              <p className="text-slate-500 text-xs uppercase mb-2">
                Monthly Revenue
              </p>

              <h2 className="text-4xl font-black text-green-300">
                ${totalRevenue.toLocaleString()}
              </h2>
            </div>

            <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
              <p className="text-slate-500 text-xs uppercase mb-2">
                Fleet Utilization
              </p>

              <h2 className="text-4xl font-black text-yellow-300">
                72%
              </h2>
            </div>

            <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
              <p className="text-slate-500 text-xs uppercase mb-2">
                Charging Costs
              </p>

              <h2 className="text-4xl font-black text-orange-300">
                $482
              </h2>
            </div>
          </div>

          {/* AI + Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 mb-8">

            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[32px] p-7">
              <p className="uppercase tracking-[0.25em] text-cyan-300 text-xs mb-2">
                AI Fleet Intelligence
              </p>

              <h2 className="text-3xl font-black mb-3">
                Mitchell Family Model X Optimization Report
              </h2>

              <p className="text-slate-300 max-w-3xl leading-relaxed">
                MCO airport arrivals projected +18% between 6–9AM tomorrow.
                Recommend dispatching CAR-001 before 6:30AM for projected revenue increase.
              </p>
            </div>

            <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-black">
                  Operational Alerts
                </h3>

                <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse"></div>
              </div>

              <div className="space-y-4">
                {[
                  'Airport demand spike detected.',
                  'CAR-003 tire efficiency reduced 11%.',
                  'Charging costs optimized overnight.',
                  'CAR-001 currently active in Lakeland.'
                ].map((alert, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 text-sm text-slate-300"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fleet Vehicles */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-3xl font-black">
                Fleet Vehicles
              </h2>

              <p className="text-slate-400">
                Live simulated telemetry
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {fleet.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] p-5 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-cyan-300 text-sm mb-1">
                        {vehicle.id}
                      </p>

                      <h3 className="text-2xl font-black">
                        {vehicle.name}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        {vehicle.model}
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300">
                      {vehicle.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-slate-800/60 rounded-2xl p-4">
                      <p className="text-slate-400 text-xs mb-1">
                        Battery
                      </p>

                      <h4 className="text-2xl font-bold">
                        {vehicle.battery}%
                      </h4>
                    </div>

                    <div className="bg-slate-800/60 rounded-2xl p-4">
                      <p className="text-slate-400 text-xs mb-1">
                        Today
                      </p>

                      <h4 className="text-2xl font-bold text-green-300">
                        ${vehicle.today}
                      </h4>
                    </div>

                    <div className="bg-slate-800/60 rounded-2xl p-4">
                      <p className="text-slate-400 text-xs mb-1">
                        Revenue
                      </p>

                      <h4 className="text-2xl font-bold text-cyan-300">
                        ${vehicle.revenue}
                      </h4>
                    </div>

                    <div className="bg-slate-800/60 rounded-2xl p-4">
                      <p className="text-slate-400 text-xs mb-1">
                        Utilization
                      </p>

                      <h4 className="text-2xl font-bold text-yellow-300">
                        {vehicle.utilization}%
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Location
                      </span>

                      <span>{vehicle.location}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Miles Today
                      </span>

                      <span>{vehicle.miles}</span>
                    </div>
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4">
                    <p className="uppercase tracking-[0.2em] text-cyan-300 text-[10px] mb-2">
                      AI Insight
                    </p>

                    <p className="text-sm text-slate-200">
                      {vehicle.ai}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}