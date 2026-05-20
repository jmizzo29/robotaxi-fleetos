// src/components/KPIGrid.jsx
export default function KPIGrid({
  totalRevenue = 12480,
  systemLoad = 87,
  avgProfitability = 76,
  avgAnomalyRisk = 12,
  forecast = { aiConfidence: 94, surgeRisk: "MED" }
}) {

  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-8">

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">Fleet Revenue</p>
        <h2 className="text-4xl font-black text-green-300">
          ${totalRevenue.toLocaleString()}
        </h2>
      </div>

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">System Load</p>
        <h2 className="text-4xl font-black text-yellow-300">
          {systemLoad}%
        </h2>
      </div>

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">Profitability</p>
        <h2 className="text-4xl font-black text-cyan-300">
          {avgProfitability}%
        </h2>
      </div>

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">AI Confidence</p>
        <h2 className="text-4xl font-black text-green-300">
          {forecast.aiConfidence}%
        </h2>
      </div>

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">Surge Risk</p>
        <h2 className="text-4xl font-black text-red-300">
          {forecast.surgeRisk}
        </h2>
      </div>

      <div className="bg-[#0b1220] rounded-3xl p-5 border border-cyan-500/10">
        <p className="text-slate-500 text-xs uppercase mb-2">Anomaly Risk</p>
        <h2 className="text-4xl font-black text-orange-300">
          {avgAnomalyRisk}%
        </h2>
      </div>

    </div>
  )
}