// src/components/KPIGrid.jsx
export default function KPIGrid({
  totalRevenue = 12480,
  systemLoad = 87,
  avgProfitability = 76,
  avgAnomalyRisk = 12,
  forecast = { aiConfidence: 94, surgeRisk: "MED" }
}) {
  const cards = [
    ['Fleet Revenue', `$${totalRevenue.toLocaleString()}`, 'text-emerald-300'],
    ['System Load', `${systemLoad}%`, 'text-amber-300'],
    ['Profitability', `${avgProfitability}%`, 'text-sky-300'],
    ['AI Confidence', `${forecast.aiConfidence}%`, 'text-emerald-300'],
    ['Surge Risk', forecast.surgeRisk, 'text-rose-300'],
    ['Anomaly Risk', `${avgAnomalyRisk}%`, 'text-orange-300'],
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
      {cards.map(([label, value, color]) => (
        <div key={label} className="rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
          <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.18em] mb-2">{label}</p>
          <h2 className={`text-3xl font-black tracking-tight ${color}`}>{value}</h2>
        </div>
      ))}
    </div>
  )
}
