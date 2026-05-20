export default function Timeline({
  timelineEvents,
  replayMode
}) {

  return (

    <div className="bg-[#0b1220] border border-cyan-500/10 rounded-[32px] p-6 mb-8">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-black">
          Live Incident Timeline
        </h2>

        <div className="text-slate-400 text-sm">

          Replay Mode:

          <span className="ml-2 text-cyan-300 font-bold">
            {replayMode ? 'ACTIVE' : 'OFF'}
          </span>

        </div>

      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto">

        {timelineEvents.map((event, index) => (

          <div
            key={index}
            className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-start gap-4"
          >

            <div
              className={`mt-1 h-3 w-3 rounded-full shrink-0
                ${
                  event.severity === 'SUCCESS'
                    ? 'bg-green-400'
                    : event.severity === 'WARNING'
                    ? 'bg-yellow-400'
                    : event.severity === 'CRITICAL'
                    ? 'bg-red-500'
                    : 'bg-cyan-400'
                }`}
            ></div>

            <div className="flex-1">

              <div className="flex items-center justify-between mb-1">

                <p className="text-xs font-bold">
                  {event.severity}
                </p>

                <p className="text-slate-500 text-xs">
                  {event.time}
                </p>

              </div>

              <p className="text-slate-300 text-sm">
                {event.message}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}