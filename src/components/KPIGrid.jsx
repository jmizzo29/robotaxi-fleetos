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
    <div className="mb-6 grid grid-cols-3 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-6">
      {cards.map(([label, value, color]) => (
        <div key={label} className="min-w-0 rounded-lg border border-white/10 bg-slate-900/80 p-3 shadow-lg shadow-black/10 sm:p-4">
          <p className="mb-2 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">{label}</p>
          <h2 className={`truncate text-2xl font-black tracking-tight sm:text-3xl ${color}`}>{value}</h2>
        </div>
      ))}
    </div>
  )
}
