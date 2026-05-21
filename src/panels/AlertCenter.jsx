export default function AlertCenter({
  fleet
}) {

  const alerts = []

  fleet.forEach((vehicle) => {

    if (vehicle.battery < 35) {
      alerts.push({
        severity: 'WARNING',
        vehicle: vehicle.id,
        message: 'Battery level approaching critical threshold.'
      })
    }

    if (vehicle.anomalyRisk > 20) {
      alerts.push({
        severity: 'CRITICAL',
        vehicle: vehicle.id,
        message: 'AI anomaly detection triggered.'
      })
    }

    if (vehicle.maintenanceScore < 75) {
      alerts.push({
        severity: 'WARNING',
        vehicle: vehicle.id,
        message: 'Maintenance degradation detected.'
      })
    }
  })

  return (

    <div className="mb-8 rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-black tracking-tight">
          Alert Center
        </h2>

        <div className="text-sm text-slate-400">

          Active Alerts:

          <span className="ml-2 text-red-400 font-bold">
            {alerts.length}
          </span>

        </div>

      </div>

      <div className="space-y-4">

        {alerts.length === 0 && (

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">

            <p className="text-green-300 font-semibold">
              All systems operating normally.
            </p>

          </div>

        )}

        {alerts.map((alert, index) => (

          <div
            key={index}
            className={`rounded-lg p-4 border
              ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
          >

            <div className="flex items-center justify-between mb-2">

              <div className="flex items-center gap-3">

                <div
                  className={`h-3 w-3 rounded-full
                    ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-500'
                        : 'bg-yellow-400'
                    }`}
                ></div>

                <span
                  className={`font-bold text-sm
                    ${
                      alert.severity === 'CRITICAL'
                        ? 'text-red-300'
                        : 'text-yellow-300'
                    }`}
                >
                  {alert.severity}
                </span>

              </div>

              <span className="text-xs text-slate-400">
                {alert.vehicle}
              </span>

            </div>

            <p className="text-sm text-slate-200">
              {alert.message}
            </p>

          </div>

        ))}

      </div>

    </div>
  )
}
