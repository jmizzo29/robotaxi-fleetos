import { useEffect, useMemo, useState } from 'react';
import {
  buildCleaningMaintenancePlan,
  buildFleetHealthSummary,
  formatCurrency,
  formatPercent,
} from '../services/robotaxiOperationsService';
import { buildFleetPricingSummary, buildPricingRecommendations } from '../services/pricingAgentService';
import { readRevenueRecords } from '../services/revenueService';

function vehicleLabel(vehicle) {
  return vehicle?.ownership?.tag || vehicle?.name || vehicle?.display_name || vehicle?.id || 'Tesla';
}

function Metric({ label, value, helper, tone = 'text-white' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function ActionCard({ eyebrow, title, detail, value, tone = 'sky', onQueue }) {
  const tones = {
    sky: 'border-sky-300/20 bg-sky-300/[0.07] text-sky-100',
    emerald: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100',
    amber: 'border-amber-300/20 bg-amber-300/[0.07] text-amber-100',
    rose: 'border-rose-300/20 bg-rose-300/[0.07] text-rose-100',
  };

  return (
    <article className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{eyebrow}</p>
          <h3 className="mt-2 text-base font-black text-white">{title}</h3>
        </div>
        {value ? <span className="rounded-md bg-slate-950/50 px-3 py-1 text-sm font-black">{value}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 opacity-85">{detail}</p>
      {onQueue ? (
        <button
          type="button"
          onClick={onQueue}
          className="mt-4 w-full rounded-md border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-950/55"
        >
          Queue Action
        </button>
      ) : null}
    </article>
  );
}

function buildDailyBrief({ fleet, healthSummary, maintenancePlan, pricingSummary }) {
  const activeCount = fleet.length;
  const highHealth = Math.round(healthSummary.avgHealth || 0);
  const chargingWindow = '11 PM - 5 AM';
  const upcomingRentals = Math.min(2, Math.max(1, Math.round(activeCount * 0.66)));
  const projectedToday = Math.round((healthSummary.totalMonthly || 0) / 26);
  const strongest = pricingSummary.strongest;
  const weakest = maintenancePlan[0];

  return {
    greeting: `Good morning, here is your fleet plan for ${activeCount || 0} Tesla${activeCount === 1 ? '' : 's'}.`,
    bullets: [
      `Fleet health is ${highHealth}/100 across the active fleet.`,
      `Best charging window: ${chargingWindow} based on off-peak planning assumptions.`,
      `${upcomingRentals} vehicle${upcomingRentals === 1 ? '' : 's'} should be cleaned before the next rental block.`,
      strongest
        ? `Pricing watch: ${vehicleLabel(strongest.vehicle)} has a ${strongest.recommendedChange > 0 ? '+' : ''}${strongest.recommendedChange}% recommendation.`
        : 'Pricing watch: add market inputs or Turo CSV records to improve confidence.',
      weakest
        ? `Maintenance watch: ${weakest.name} should get ${weakest.task.toLowerCase()} ${weakest.window.toLowerCase()}.`
        : 'Maintenance watch: no urgent action detected.',
    ],
    projectedToday,
  };
}

function buildImpact({ pricingRecommendations, healthSummary, maintenancePlan }) {
  const positivePricing = pricingRecommendations
    .filter((item) => item.recommendedChange > 0)
    .reduce((sum, item) => {
      const base = Number(item.recommendedDailyRate || item.vehicle?.dailyRate || item.vehicle?.marketRate || 125);
      return sum + Math.round(base * (item.recommendedChange / 100) * 2);
    }, 0);

  const chargingSavings = Math.max(45, Math.round((healthSummary.estimates?.length || 1) * 34));
  const downtimeProtection = maintenancePlan
    .filter((item) => item.priority === 'HIGH')
    .reduce((sum, item) => sum + Math.max(95, Math.round(item.dailyEstimate || 110)), 0);

  return {
    pricing: positivePricing,
    charging: chargingSavings,
    downtime: downtimeProtection,
    total: positivePricing + chargingSavings + downtimeProtection,
  };
}

export default function OwnerValueDashboard({ fleet = [], onQueueCommand }) {
  const [revenueRecords, setRevenueRecords] = useState(() => readRevenueRecords());

  useEffect(() => {
    const refresh = () => setRevenueRecords(readRevenueRecords());
    refresh();
    window.addEventListener('fleetos-revenue-updated', refresh);
    return () => window.removeEventListener('fleetos-revenue-updated', refresh);
  }, []);

  const healthSummary = useMemo(() => buildFleetHealthSummary(fleet, revenueRecords), [fleet, revenueRecords]);
  const maintenancePlan = useMemo(() => buildCleaningMaintenancePlan(fleet, revenueRecords), [fleet, revenueRecords]);
  const pricingRecommendations = useMemo(
    () => buildPricingRecommendations({ fleet, revenueRecords }),
    [fleet, revenueRecords],
  );
  const pricingSummary = useMemo(() => buildFleetPricingSummary(pricingRecommendations), [pricingRecommendations]);
  const dailyBrief = useMemo(
    () => buildDailyBrief({ fleet, healthSummary, maintenancePlan, pricingSummary }),
    [fleet, healthSummary, maintenancePlan, pricingSummary],
  );
  const impact = useMemo(
    () => buildImpact({ pricingRecommendations, healthSummary, maintenancePlan }),
    [pricingRecommendations, healthSummary, maintenancePlan],
  );

  const topPricing = pricingRecommendations[0];
  const topMaintenance = maintenancePlan[0];
  const avgHealth = Math.round(healthSummary.avgHealth || 0);

  return (
    <section className="space-y-4" data-testid="owner-value-dashboard">
      <article className="rounded-xl border border-emerald-300/20 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Owner Value Dashboard</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Today&apos;s AI fleet brief</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{dailyBrief.greeting}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {dailyBrief.bullets.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-3 text-sm font-semibold leading-5 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 xl:min-w-[360px]">
            <Metric label="Projected Today" value={formatCurrency(dailyBrief.projectedToday)} tone="text-emerald-300" />
            <Metric label="Fleet Health" value={`${avgHealth}/100`} tone={avgHealth >= 84 ? 'text-emerald-300' : avgHealth >= 72 ? 'text-amber-300' : 'text-rose-300'} />
            <Metric label="Weekend Upside" value={formatCurrency(impact.total)} tone="text-sky-300" helper="Modeled opportunity" />
            <Metric label="Utilization" value={formatPercent(healthSummary.avgUtilization)} tone="text-amber-300" />
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <ActionCard
          eyebrow="Realistic Goal"
          title="Maximize weekend earnings"
          detail="FleetOS can balance local demand, weather, vehicle health, charge state, cleaning, and owner approval into one weekend plan."
          value={formatCurrency(impact.total)}
          tone="emerald"
          onQueue={() => onQueueCommand?.('Maximize earnings this weekend across my Tesla fleet', 'HIGH')}
        />
        <ActionCard
          eyebrow="Dynamic Pricing"
          title={topPricing ? `${vehicleLabel(topPricing.vehicle)}: ${topPricing.recommendedChange > 0 ? '+' : ''}${topPricing.recommendedChange}%` : 'Add pricing inputs'}
          detail={topPricing ? `Confidence ${topPricing.confidence}%. ${topPricing.signals?.[0]?.detail || 'Pricing signal ready.'}` : 'Upload Turo CSV or add market rates to improve pricing recommendations.'}
          value={topPricing?.recommendedDailyRate ? `${formatCurrency(topPricing.recommendedDailyRate)}/day` : null}
          tone="sky"
          onQueue={() => onQueueCommand?.('Review dynamic Turo pricing recommendations for this weekend', 'HIGH')}
        />
        <ActionCard
          eyebrow="Predictive Maintenance"
          title={topMaintenance ? `${topMaintenance.name}: ${topMaintenance.task}` : 'No urgent watch'}
          detail={topMaintenance ? `${topMaintenance.reason} Suggested window: ${topMaintenance.window}.` : 'FleetOS did not detect a high-priority maintenance item yet.'}
          value={topMaintenance?.priority}
          tone={topMaintenance?.priority === 'HIGH' ? 'rose' : 'amber'}
          onQueue={() => onQueueCommand?.(`Schedule maintenance or cleaning: ${topMaintenance?.name || 'fleet review'}`, topMaintenance?.priority || 'NORMAL')}
        />
        <ActionCard
          eyebrow="Impact Tracking"
          title={`${formatCurrency(impact.total)} modeled upside`}
          detail={`${formatCurrency(impact.pricing)} pricing, ${formatCurrency(impact.charging)} charging optimization, ${formatCurrency(impact.downtime)} downtime protection.`}
          value="Monthly proof"
          tone="emerald"
          onQueue={() => onQueueCommand?.('Generate monthly FleetOS earnings impact report', 'NORMAL')}
        />
      </div>
    </section>
  );
}
