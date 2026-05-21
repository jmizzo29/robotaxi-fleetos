export default function CommandCenter({
  setReplayMode,
  replayMode,
  fleet,
  enqueueCommand = () => {}
}) {

  const executeCommand = (command, priority = 'NORMAL') => {
    enqueueCommand(command, priority)
  }

  return (

    <div className="mb-8 rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-black tracking-tight">
          Command Center
        </h2>

        <div className="text-sm font-semibold text-sky-300">
          Operator Mode: Live
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <button
          onClick={() =>
            executeCommand('Emergency Fleet Rebalance', 'HIGH')
          }
          className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-5 text-left transition-all hover:bg-sky-500/20"
        >

          <p className="mb-2 text-sm font-bold text-sky-300">
            DISPATCH
          </p>

          <h3 className="text-xl font-black mb-2">
            Fleet Rebalance
          </h3>

          <p className="text-slate-400 text-sm">
            AI redistributes vehicles across demand corridors.
          </p>

        </button>

        <button
          onClick={() =>
            executeCommand('Regional Lockdown Activated', 'CRITICAL')
          }
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-left transition-all hover:bg-red-500/20"
        >

          <p className="text-red-300 text-sm font-bold mb-2">
            EMERGENCY
          </p>

          <h3 className="text-xl font-black mb-2">
            Lockdown Region
          </h3>

          <p className="text-slate-400 text-sm">
            Restrict autonomous routing in critical zones.
          </p>

        </button>

        <button
          onClick={() =>
            executeCommand('Charging Optimization Triggered', 'NORMAL')
          }
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-left transition-all hover:bg-emerald-500/20"
        >

          <p className="mb-2 text-sm font-bold text-emerald-300">
            ENERGY
          </p>

          <h3 className="text-xl font-black mb-2">
            Optimize Charging
          </h3>

          <p className="text-slate-400 text-sm">
            AI minimizes charging congestion and energy costs.
          </p>

        </button>

        <button
          onClick={() =>
            setReplayMode(!replayMode)
          }
          className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-5 text-left transition-all hover:bg-violet-500/20"
        >

          <p className="mb-2 text-sm font-bold text-violet-300">
            SIMULATION
          </p>

          <h3 className="text-xl font-black mb-2">
            Replay Engine
          </h3>

          <p className="text-slate-400 text-sm">
            {replayMode
              ? 'Disable historical replay mode.'
              : 'Enable accelerated simulation playback.'}
          </p>

        </button>

      </div>

      {/* LIVE FLEET SUMMARY */}

      <div className="mt-8 rounded-lg border border-white/5 bg-slate-950/50 p-5">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-xl font-black">
            Fleet Readiness
          </h3>

          <span className="font-bold text-emerald-300">
            {fleet.length} ACTIVE VEHICLES
          </span>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {fleet.map((vehicle) => (

            <div
              key={vehicle.id}
              className="rounded-lg border border-white/10 bg-slate-900 p-4"
            >

              <div className="flex justify-between mb-2">

                <span className="font-bold text-sky-300">
                  {vehicle.id}
                </span>

                <span
                  className={`text-xs font-bold
                    ${
                      vehicle.battery < 30
                        ? 'text-yellow-300'
                        : 'text-emerald-300'
                    }`}
                >
                  {Math.round(vehicle.battery)}%
                </span>

              </div>

              <p className="text-xs text-slate-400 mb-2">
                {vehicle.status}
              </p>

              <div className="h-2 rounded-full bg-black/40 overflow-hidden">

                <div
                  className={`h-full rounded-full
                    ${
                      vehicle.anomalyRisk > 20
                        ? 'bg-red-500'
                        : 'bg-sky-400'
                    }`}
                  style={{
                    width: `${vehicle.utilization}%`
                  }}
                ></div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}
