import { MapPin } from 'lucide-react';
import { buildMarketRentalAnswer, inferOwnerMarket } from '../services/marketIntelligenceService';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function average(values) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function statusLabel(vehicle) {
  const raw = String(vehicle.status || vehicle.state || '').toLowerCase();
  const charging = String(vehicle.chargingState || '').toLowerCase();

  if (charging.includes('charging')) return 'Charging';
  if (raw.includes('service')) return 'Service';
  if (raw.includes('pickup') || raw.includes('route') || raw.includes('rental') || raw.includes('en route')) return 'In Rental';
  if (raw.includes('reposition')) return 'Repositioning';
  return 'Ready';
}

function statusTone(status) {
  if (status === 'Charging') return 'border-sky-300/20 bg-sky-400/[0.08] text-sky-200';
  if (status === 'In Rental') return 'border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-200';
  if (status === 'Service') return 'border-red-300/20 bg-red-400/[0.08] text-red-200';
  if (status === 'Repositioning') return 'border-amber-300/20 bg-amber-400/[0.08] text-amber-200';
  return 'border-white/10 bg-white/[0.05] text-slate-200';
}

function MetricCard({ label, value, detail, tone = 'sky' }) {
  const tones = {
    emerald: 'border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-200',
    sky: 'border-sky-300/20 bg-sky-400/[0.07] text-sky-200',
    amber: 'border-amber-300/20 bg-amber-400/[0.07] text-amber-200',
    rose: 'border-rose-300/20 bg-rose-400/[0.07] text-rose-200',
  };

  return (
    <article className={`rounded-lg border p-4 ${tones[tone] || tones.sky}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-80">{detail}</p>
    </article>
  );
}

export default function ServiceAreasPanel({ fleet = [], demandZones = [], onQueueCommand }) {
  const totalRevenue = fleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);
  const avgHealth = average(fleet.map((vehicle) => vehicle.maintenanceScore ?? vehicle.healthScore ?? 88));
  const avgUtilization = average(fleet.map((vehicle) => vehicle.utilization ?? 0));
  const bestZone = [...demandZones].sort((a, b) => (b.profitability || 0) - (a.profitability || 0))[0];
  const readyCount = fleet.filter((vehicle) => ['Ready', 'Repositioning'].includes(statusLabel(vehicle))).length;
  const ownerMarket = inferOwnerMarket(fleet);
  const marketAnswer = buildMarketRentalAnswer(`What are the top rented Teslas in ${ownerMarket.market?.city || 'Orlando'}?`, fleet);
  const topModels = ownerMarket.market?.topTeslaModels || [];

  return (
    <section className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Earnings Today"
          value={formatCurrency(totalRevenue / 9)}
          detail="Estimated from fleet revenue signals"
          tone="emerald"
        />
        <MetricCard
          label="Fleet Health"
          value={`${avgHealth}%`}
          detail={`${fleet.length} vehicles monitored`}
          tone="sky"
        />
      </div>

      {/* Extra mobile context for Map tab */}
      <div className="lg:hidden -mt-2 rounded-3xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200">
        <div className="flex items-center gap-2 text-emerald-300">
          <MapPin className="h-4 w-4" /> {readyCount} vehicles in strong zones • Tap map for live positions
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Utilization"
          value={`${avgUtilization}%`}
          detail={`${readyCount} vehicles ready or repositioning`}
          tone="amber"
        />
        <MetricCard
          label="Best Zone"
          value={bestZone?.name || 'Pending'}
          detail={bestZone ? `${bestZone.profitability}% profitability` : 'Sync demand context'}
          tone="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Service Areas</p>
              <h2 className="mt-2 text-2xl font-black text-white">Demand and pricing zones</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                ROBOAGENT blends vehicle location, demand heat, owner economics, and health status into service-area recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onQueueCommand?.('Review service-area pricing zones and vehicle staging recommendations', 'AI')}
              className="rounded-md border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-300/20"
            >
              Queue AI Review
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {demandZones.map((zone) => {
              const priceLift = Math.max(0, Math.round((zone.surgeMultiplier - 1) * 18));
              return (
                <div key={zone.name} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{zone.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Recommended pricing zone</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-black text-slate-950" style={{ background: zone.color }}>
                      +{priceLift}%
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                        <span>Demand</span>
                        <span>{zone.demand}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full rounded-full" style={{ width: `${zone.demand}%`, background: zone.color }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                        <span>Earnings heat</span>
                        <span>{zone.profitability}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full rounded-full" style={{ width: `${zone.profitability}%`, background: zone.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Vehicle Status</p>
          <h2 className="mt-2 text-2xl font-black text-white">Health on the map</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use this list with the map below to decide whether a vehicle should earn, charge, clean, or stay out of service.
          </p>

          <div className="mt-5 space-y-3">
            {fleet.slice(0, 6).map((vehicle) => {
              const status = statusLabel(vehicle);
              const health = Math.round(Number(vehicle.maintenanceScore ?? vehicle.healthScore ?? 88));
              return (
                <div key={vehicle.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{vehicle.name || vehicle.display_name || vehicle.id}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{vehicle.assignment || vehicle.city || 'Fleet vehicle'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusTone(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold">
                    <div className="rounded-md bg-white/[0.04] p-2">
                      <p className="text-slate-500">Health</p>
                      <p className="mt-1 text-emerald-300">{health}%</p>
                    </div>
                    <div className="rounded-md bg-white/[0.04] p-2">
                      <p className="text-slate-500">Battery</p>
                      <p className="mt-1 text-sky-300">{Math.round(Number(vehicle.battery) || 0)}%</p>
                    </div>
                    <div className="rounded-md bg-white/[0.04] p-2">
                      <p className="text-slate-500">ROI</p>
                      <p className="mt-1 text-amber-300">{Math.round(Number(vehicle.profitability) || 0)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-emerald-300/15 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Local Rental Market</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Top rented Teslas near {ownerMarket.market?.city || 'your operating area'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              ROBOAGENT infers the owner market from connected vehicle city/GPS when available, then answers market questions with transparent confidence. This is not live Turo inventory yet; it becomes stronger as owners import rental history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQueueCommand?.(`Answer market question: ${marketAnswer.title}. ${marketAnswer.summary}`, 'HIGH')}
            className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/20"
          >
            Ask Market Agent
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {topModels.map((item, index) => (
            <div key={item.model} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rank {index + 1}</p>
                  <h3 className="mt-2 text-lg font-black text-white">{item.model}</h3>
                </div>
                <span className="rounded-md border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-xs font-black text-sky-200">
                  {ownerMarket.market?.confidence || 0}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.reason}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/55 p-4 text-sm leading-6 text-slate-300">
          <span className="font-black text-emerald-300">Market logic:</span> {marketAnswer.impact}
        </div>
      </article>
    </section>
  );
}
