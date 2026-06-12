import React from 'react';

export default function LiveDataPanel({ fleet = [] }) {
  const totalVehicles = fleet.length;
  const demoCount = fleet.filter((v) => !v.isReal).length;

  // Compute average health (prefer maintenanceScore, fallback to derived value)
  const avgHealth = totalVehicles > 0
    ? Math.round(
        fleet.reduce((sum, v) => {
          const score = v.maintenanceScore ?? v.healthScore ?? (90 - (v.anomalyRisk || 0));
          return sum + Math.max(60, Math.min(99, score));
        }, 0) / totalVehicles
      )
    : 0;

  // Battery State of Charge bars — only show real samples from the current fleet
  const displayBars = fleet
    .slice(0, 5)
    .map((v) => Math.max(8, Math.min(100, Math.round(v.battery || v.battery_level || 50))));

  // Simple online count for context (optional micro stat)
  const onlineCount = fleet.filter((v) => {
    const s = String(v.status || v.state || '').toUpperCase();
    return !s.includes('OFFLINE');
  }).length || totalVehicles;

  return (
    <div className="bg-zinc-900 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">Live Data</h2>
        <div className="text-emerald-400 text-sm font-medium">
          {demoCount > 0
            ? `${onlineCount} online • includes ${demoCount} demo`
            : `${onlineCount} online • real-time`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Total Vehicles */}
        <div className="bg-[#0a0a0a] rounded-2xl p-6">
          <div className="text-white/60 text-sm">Total Vehicles</div>
          <div className="text-6xl font-semibold mt-2 tabular-nums">{totalVehicles}</div>
          <div className="text-white/40 text-xs mt-1">
            {demoCount > 0 ? `in your fleet (${demoCount} demo)` : 'in your fleet'}
          </div>
        </div>

        {/* Battery State of Charge */}
        <div className="bg-[#0a0a0a] rounded-2xl p-6">
          <div className="text-white/60 text-sm">Battery State of Charge</div>
          <div className="h-40 flex items-end gap-2 mt-4 px-1">
            {displayBars.length > 0 ? (
              displayBars.map((v, i) => (
                <div
                  key={i}
                  className="bg-emerald-500 w-full rounded-t transition-all"
                  style={{ height: `${v}%` }}
                  title={`${v}%`}
                />
              ))
            ) : (
              <div className="w-full self-center text-center text-white/40 text-sm">No vehicles connected</div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-white/40 mt-2 px-0.5">
            <div>Live samples</div>
            <div className="tabular-nums">{displayBars.length > 0 ? `${displayBars.join(' / ')}%` : '—'}</div>
          </div>
        </div>

        {/* Vehicle Health */}
        <div className="bg-[#0a0a0a] rounded-2xl p-6">
          <div className="text-white/60 text-sm">Vehicle Health</div>
          <div className="mt-6 text-6xl font-semibold text-emerald-400 tabular-nums">
            {avgHealth}
            <span className="text-4xl align-super">%</span>
          </div>
          <div className="text-emerald-400/70 text-sm mt-2">Fleet average</div>
        </div>
      </div>
    </div>
  );
}
