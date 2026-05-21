export default function Sidebar({
  replayMode,
  setReplayMode,
  commandQueue,
  demandZones
}) {

  return (

    <aside className="hidden lg:flex w-[320px] border-r border-white/10 bg-slate-950/80 flex-col p-6 overflow-y-auto">

      <div className="mb-10">

        <div className="flex items-center gap-3 mb-3">

          <div className="h-2.5 w-2.5 rounded-full bg-sky-400"></div>

          <span className="text-sky-300 uppercase tracking-[0.28em] text-xs">
            FleetOS
          </span>

        </div>

        <h1 className="text-3xl font-black leading-tight">
          FleetOS
          <span className="block text-sky-300">
            Operations Console
          </span>
        </h1>

      </div>

      <button
        onClick={() => setReplayMode(!replayMode)}
        className={`mb-6 py-4 rounded-lg font-bold transition-all ${
          replayMode
            ? 'bg-sky-300 text-slate-950'
            : 'bg-sky-400/10 text-sky-200 border border-sky-400/30'
        }`}
      >
        {replayMode
          ? 'Replay Mode Active'
          : 'Enable Replay Mode'}
      </button>

      <div className="mb-8">

        <p className="uppercase tracking-[0.22em] text-sky-300 text-xs mb-4">
          Command Queue
        </p>

        <div className="space-y-3">

          {commandQueue.map((cmd, index) => (

            <div
              key={index}
              className="bg-slate-900/80 border border-white/10 rounded-lg p-4"
            >

              <div className="flex items-center justify-between mb-2">

                <span
                  className={`text-xs font-bold
                    ${
                      cmd.priority === 'CRITICAL'
                        ? 'text-red-400'
                        : cmd.priority === 'HIGH'
                        ? 'text-yellow-300'
                        : 'text-sky-300'
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

      <div className="bg-slate-900/80 border border-white/10 rounded-lg p-5">

        <p className="uppercase tracking-[0.22em] text-sky-300 text-xs mb-4">
          Regional Performance
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
