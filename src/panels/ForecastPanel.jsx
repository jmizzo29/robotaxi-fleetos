export default function ForecastPanel({ forecast }) {
  if (!forecast) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Predicted Demand</p>
        <h2 className="text-3xl font-black text-cyan-300">{forecast.predictedDemand}</h2>
      </div>

      <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Tomorrow Revenue</p>
        <h2 className="text-3xl font-black text-green-300">
          ${forecast.projectedRevenue.toLocaleString()}
        </h2>
      </div>

      <div className="bg-[#0b1220] border border-cyan-500/10 rounded-3xl p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Congestion Risk</p>
        <h2 className="text-3xl font-black text-yellow-300">{forecast.congestionRisk}</h2>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5">
        <p className="text-cyan-300 text-xs uppercase mb-2">AI Recommendation</p>
        <h2 className="text-2xl font-black mb-2">Expand Orlando Capacity</h2>
        <p className="text-slate-300 text-sm">
          AI predicts elevated airport demand between 6AM-11AM.
        </p>
      </div>
    </div>
  );
}
