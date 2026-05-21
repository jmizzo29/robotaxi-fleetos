export default function ForecastPanel({ forecast }) {
  if (!forecast) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-8">
      <div className="bg-slate-900/80 border border-white/10 rounded-lg p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Predicted Demand</p>
        <h2 className="text-2xl font-black text-sky-300">{forecast.predictedDemand}</h2>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-lg p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Tomorrow Revenue</p>
        <h2 className="text-2xl font-black text-emerald-300">
          ${forecast.projectedRevenue.toLocaleString()}
        </h2>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-lg p-5">
        <p className="text-slate-500 text-xs uppercase mb-2">Congestion Risk</p>
        <h2 className="text-2xl font-black text-amber-300">{forecast.congestionRisk}</h2>
      </div>

      <div className="bg-sky-400/10 border border-sky-400/20 rounded-lg p-5">
        <p className="text-sky-300 text-xs uppercase mb-2">AI Recommendation</p>
        <h2 className="text-2xl font-black mb-2">Expand Orlando Capacity</h2>
        <p className="text-slate-300 text-sm">
          AI predicts elevated airport demand between 6AM-11AM.
        </p>
      </div>
    </div>
  );
}
