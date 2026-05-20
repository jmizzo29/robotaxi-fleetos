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

    <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] p-6 mb-8">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-black">
          Fleet Command Center
        </h2>

        <div className="text-sm text-cyan-300 font-semibold">
          Operator Access Level: OMEGA
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <button
          onClick={() =>
            executeCommand('Emergency Fleet Rebalance', 'HIGH')
          }
          className="bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all rounded-2xl p-5 text-left"
        >

          <p className="text-cyan-300 text-sm font-bold mb-2">
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
          className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all rounded-2xl p-5 text-left"
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
          className="bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all rounded-2xl p-5 text-left"
        >

          <p className="text-green-300 text-sm font-bold mb-2">
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
          className="bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all rounded-2xl p-5 text-left"
        >

          <p className="text-purple-300 text-sm font-bold mb-2">
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

      <div className="mt-8 bg-black/20 rounded-2xl p-5 border border-white/5">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-xl font-black">
            Fleet Readiness
          </h3>

          <span className="text-green-300 font-bold">
            {fleet.length} ACTIVE VEHICLES
          </span>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {fleet.map((vehicle) => (

            <div
              key={vehicle.id}
              className="bg-[#111827] rounded-xl p-4 border border-cyan-500/10"
            >

              <div className="flex justify-between mb-2">

                <span className="font-bold text-cyan-300">
                  {vehicle.id}
                </span>

                <span
                  className={`text-xs font-bold
                    ${
                      vehicle.battery < 30
                        ? 'text-yellow-300'
                        : 'text-green-300'
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
                        : 'bg-cyan-400'
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
