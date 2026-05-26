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

function formatTelemetryValue(value) {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'Unavailable';
    return Math.abs(value) > 999 ? Math.round(value).toLocaleString() : String(Math.round(value * 100) / 100);
  }
  return String(value);
}

function labelFromKey(key) {
  return key
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function flattenTelemetry(input, prefix = '', rows = []) {
  if (!input || typeof input !== 'object') return rows;
  Object.entries(input).forEach(([key, value]) => {
    if (['ownership', 'route', 'history', 'events'].includes(key)) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      rows.push([path, value]);
      return;
    }
    if (Array.isArray(value)) {
      rows.push([path, `${value.length} item${value.length === 1 ? '' : 's'}`]);
      return;
    }
    if (typeof value === 'object') {
      flattenTelemetry(value, path, rows);
      return;
    }
    rows.push([path, value]);
  });
  return rows;
}

function buildTelemetryRows(vehicle) {
  if (!vehicle) return [];
  const priority = [
    ['Name', vehicleLabel(vehicle)],
    ['VIN', vehicle.vin],
    ['Status', vehicle.status || vehicle.state],
    ['Battery', vehicle.battery !== undefined ? `${Math.round(Number(vehicle.battery) || 0)}%` : undefined],
    ['Charging State', vehicle.chargingState],
    ['Odometer', vehicle.odometer ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : undefined],
    ['Speed', vehicle.speed !== undefined ? `${Math.round(Number(vehicle.speed) || 0)} mph` : undefined],
    ['Locked', vehicle.locked],
    ['Service Mode', vehicle.serviceMode],
    ['Software', vehicle.softwareVersion],
    ['Latitude', vehicle.latitude],
    ['Longitude', vehicle.longitude],
    ['Heading', vehicle.heading],
    ['GPS As Of', vehicle.gpsAsOf],
    ['Synced At', vehicle.syncedAt],
  ];

  const seen = new Set(priority.map(([label]) => label.toLowerCase()));
  const rest = flattenTelemetry(vehicle)
    .map(([key, value]) => [labelFromKey(key), value])
    .filter(([label]) => {
      const normalized = label.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  return [...priority, ...rest].filter(([, value]) => value !== undefined);
}

function TelemetrySnapshot({ fleet }) {
  const vehicle = fleet.find((item) => item.isReal) || fleet[0];
  const rows = buildTelemetryRows(vehicle);

  return (
    <article className="rounded-xl border border-sky-300/20 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Live Tesla Telemetry</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Owner dashboard data snapshot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            All available primitive telemetry fields for {vehicle ? vehicleLabel(vehicle) : 'your first synced Tesla'} appear here after sync.
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
          {rows.length || 0} fields
        </span>
      </div>

      {vehicle ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Battery" value={vehicle.battery !== undefined ? `${Math.round(Number(vehicle.battery) || 0)}%` : '--'} tone="text-emerald-300" />
            <Metric label="Status" value={formatTelemetryValue(vehicle.status || vehicle.state)} tone="text-sky-300" />
            <Metric label="Odometer" value={vehicle.odometer ? `${Math.round(vehicle.odometer).toLocaleString()} mi` : '--'} tone="text-amber-300" />
            <Metric label="Charging" value={formatTelemetryValue(vehicle.chargingState)} tone="text-violet-300" />
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-white/10">
            {rows.map(([label, value]) => (
              <div key={`${label}-${String(value)}`} className="grid grid-cols-[0.95fr_1.05fr] gap-3 border-b border-white/10 bg-slate-950/35 px-3 py-2 text-sm last:border-b-0">
                <p className="font-bold text-slate-400">{label}</p>
                <p className="break-words text-right font-black text-slate-100">{formatTelemetryValue(value)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-white/10 bg-slate-950/45 p-4 text-sm font-semibold text-slate-400">
          Sync Tesla telemetry to populate battery, GPS, odometer, charging, locks, software, service mode, and raw vehicle fields.
        </p>
      )}
    </article>
  );
}

function ActionCard({ eyebrow, title, detail, value, tone = 'sky', onQueue, buttonLabel = 'Queue Action' }) {
  const tones = {
    sky: 'border-sky-300/20 bg-sky-300/[0.07] text-sky-100',
    emerald: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100',
    amber: 'border-amber-300/20 bg-amber-300/[0.07] text-amber-100',
    rose: 'border-rose-300/20 bg-rose-300/[0.07] text-rose-100',
    violet: 'border-violet-300/20 bg-violet-300/[0.07] text-violet-100',
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
          {buttonLabel}
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

function buildChargingPlan(fleet = []) {
  const vehicles = fleet.map((vehicle) => ({
    vehicle,
    battery: Number(vehicle.battery ?? vehicle.batteryLevel ?? vehicle.chargeState?.battery_level ?? 0),
    status: String(vehicle.status || vehicle.state || '').toLowerCase(),
  }));
  const needsCharge = vehicles
    .filter((item) => item.battery > 0 && item.battery < 65)
    .sort((a, b) => a.battery - b.battery);
  const readyCount = vehicles.filter((item) => item.battery >= 75).length;
  const asleepCount = vehicles.filter((item) => item.status.includes('asleep')).length;
  const target = needsCharge[0] || vehicles.sort((a, b) => a.battery - b.battery)[0];

  return {
    target,
    readyCount,
    asleepCount,
    window: '11 PM - 5 AM',
    detail: target
      ? `${vehicleLabel(target.vehicle)} is at ${Math.round(target.battery || 0)}%. Charge during the off-peak window and avoid extra wakes unless a rental is imminent.`
      : 'No vehicle charge action is needed until the next telemetry sync.',
    value: needsCharge.length ? `${needsCharge.length} to charge` : `${readyCount} ready`,
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
  const chargingPlan = useMemo(() => buildChargingPlan(fleet), [fleet]);

  const topPricing = pricingRecommendations[0];
  const topMaintenance = maintenancePlan[0];
  const avgHealth = Math.round(healthSummary.avgHealth || 0);
  const criticalMaintenance = maintenancePlan.filter((item) => item.priority === 'HIGH').length;
  const pricingUpsideCount = pricingRecommendations.filter((item) => item.recommendedChange > 0).length;

  return (
    <section className="space-y-4" data-testid="owner-value-dashboard">
      <article className="rounded-xl border border-emerald-300/20 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-5">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Owner Value Dashboard</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Today&apos;s AI fleet brief</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{dailyBrief.greeting}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric label="Projected Today" value={formatCurrency(dailyBrief.projectedToday)} tone="text-emerald-300" />
            <Metric label="Fleet Health" value={`${avgHealth}/100`} tone={avgHealth >= 84 ? 'text-emerald-300' : avgHealth >= 72 ? 'text-amber-300' : 'text-rose-300'} />
            <Metric label="Weekend Upside" value={formatCurrency(impact.total)} tone="text-sky-300" helper="Modeled opportunity" />
            <Metric label="Utilization" value={formatPercent(healthSummary.avgUtilization)} tone="text-amber-300" />
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ActionCard
          eyebrow="Today's AI Brief"
          title={`${fleet.length || 0} vehicles in plan`}
          detail={dailyBrief.bullets.slice(0, 3).join(' ')}
          value={formatCurrency(dailyBrief.projectedToday)}
          tone="emerald"
          buttonLabel="Open Brief"
          onQueue={() => onQueueCommand?.('Give me today’s full RoboAgent fleet brief with exact next steps', 'HIGH')}
        />
        <ActionCard
          eyebrow="Pricing Opportunities"
          title={topPricing ? `${pricingUpsideCount} price move${pricingUpsideCount === 1 ? '' : 's'} found` : 'Add pricing inputs'}
          detail={topPricing ? `${vehicleLabel(topPricing.vehicle)}: ${topPricing.recommendedChange > 0 ? '+' : ''}${topPricing.recommendedChange}% with ${topPricing.confidence}% confidence. ${topPricing.signals?.[0]?.detail || ''}` : 'Upload Turo CSV or add market rates to unlock better pricing recommendations.'}
          value={topPricing?.recommendedDailyRate ? `${formatCurrency(topPricing.recommendedDailyRate)}/day` : null}
          tone="sky"
          buttonLabel="Review Pricing"
          onQueue={() => onQueueCommand?.('Review dynamic Turo pricing recommendations for this weekend', 'HIGH')}
        />
        <ActionCard
          eyebrow="Maintenance Watch"
          title={criticalMaintenance ? `${criticalMaintenance} high priority` : 'No urgent watch'}
          detail={topMaintenance ? `${topMaintenance.reason} Suggested window: ${topMaintenance.window}.` : 'RoboAgent did not detect a high-priority maintenance item yet.'}
          value={topMaintenance?.priority}
          tone={topMaintenance?.priority === 'HIGH' ? 'rose' : 'amber'}
          buttonLabel="Plan Service"
          onQueue={() => onQueueCommand?.(`Schedule maintenance or cleaning: ${topMaintenance?.name || 'fleet review'}`, topMaintenance?.priority || 'NORMAL')}
        />
        <ActionCard
          eyebrow="Charging Plan"
          title={chargingPlan.window}
          detail={chargingPlan.detail}
          value={chargingPlan.value}
          tone="violet"
          buttonLabel="Plan Charging"
          onQueue={() => onQueueCommand?.(`Build tonight’s charging plan: ${chargingPlan.detail}`, 'NORMAL')}
        />
        <ActionCard
          eyebrow="Estimated Earnings Impact"
          title={`${formatCurrency(impact.total)} modeled upside`}
          detail={`${formatCurrency(impact.pricing)} pricing, ${formatCurrency(impact.charging)} charging optimization, ${formatCurrency(impact.downtime)} downtime protection.`}
          value="Monthly proof"
          tone="emerald"
          buttonLabel="Show Impact"
          onQueue={() => onQueueCommand?.('Generate monthly RoboAgent earnings impact report', 'NORMAL')}
        />
      </div>

      <TelemetrySnapshot fleet={fleet} />
    </section>
  );
}
