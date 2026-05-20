export default function Sidebar({
  replayMode,
  setReplayMode,
  commandQueue,
  demandZones
}) {

  return (

    <aside className="hidden lg:flex w-[320px] border-r border-cyan-500/10 bg-black/20 flex-col p-6 overflow-y-auto">

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

      <button
        onClick={() => setReplayMode(!replayMode)}
        className={`mb-6 py-4 rounded-2xl font-bold transition-all ${
          replayMode
            ? 'bg-cyan-400 text-black'
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
        }`}
      >
        {replayMode
          ? 'Replay Mode Active'
          : 'Enable Replay Mode'}
      </button>

      <div className="mb-8">

        <p className="uppercase tracking-[0.25em] text-cyan-300 text-xs mb-4">
          Live Command Queue
        </p>

        <div className="space-y-3">

          {commandQueue.map((cmd, index) => (

            <div
              key={index}
              className="bg-[#0b1220] border border-cyan-500/10 rounded-2xl p-4"
            >

              <div className="flex items-center justify-between mb-2">

                <span
                  className={`text-xs font-bold
                    ${
                      cmd.priority === 'CRITICAL'
                        ? 'text-red-400'
                        : cmd.priority === 'HIGH'
                        ? 'text-yellow-300'
                        : 'text-cyan-300'
                    }`}
                >
                  {cmd.priority}
                </span>

              </div>

              <p className="text-sm text-slate-300">
                {cmd.command}
              </p>

            </div>

          ))}

        </div>

      </div>

      <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">

        <p className="uppercase tracking-[0.25em] text-cyan-300 text-xs mb-4">
          Regional Profitability Matrix
        </p>

        <div className="space-y-4">

          {demandZones.map((zone) => (

            <div key={zone.name}>

              <div className="flex justify-between mb-1 text-sm">

                <span>{zone.name}</span>

                <span className="text-green-300">
                  {zone.profitability}%
                </span>

              </div>

              <div className="h-2 bg-black/40 rounded-full overflow-hidden">

                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${zone.profitability}%`,
                    background: zone.color
                  }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

    </aside>
  )
}