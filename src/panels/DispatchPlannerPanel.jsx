function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function distanceMiles(a, b) {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) return 0;

  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.round(earthMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function nearestCharger(vehicle, chargingStations) {
  return chargingStations
    .map((station) => ({
      ...station,
      distance: distanceMiles(vehicle, station),
    }))
    .sort((a, b) => a.distance - b.distance || a.occupancy - b.occupancy)[0];
}

function bestZone(vehicle, demandZones) {
  const battery = Number(vehicle.battery) || 0;
  const riskPenalty = Number(vehicle.anomalyRisk) || 0;

  return demandZones
    .map((zone) => {
      const distance = distanceMiles(vehicle, zone);
      const score =
        zone.profitability * 1.4 +
        zone.demand +
        zone.surgeMultiplier * 18 -
        distance * 0.32 -
        riskPenalty * 0.7 +
        (battery > 70 ? 8 : battery < 40 ? -18 : 0);

      return { ...zone, distance, score: Math.round(score) };
    })
    .sort((a, b) => b.score - a.score)[0];
}

function planForVehicle(vehicle, demandZones, chargingStations) {
  const zone = bestZone(vehicle, demandZones);
  const charger = nearestCharger(vehicle, chargingStations);
  const battery = Number(vehicle.battery) || 0;
  const risk = Number(vehicle.anomalyRisk) || 0;
  const needsCharge = battery < 55;
  const isParked = `${vehicle.status || vehicle.state || ''}`.toLowerCase().includes('park');
  const expectedRevenue = Math.round(
    (zone?.profitability || 75) * (zone?.surgeMultiplier || 1.2) * (vehicle.isReal ? 9 : 13) +
    (vehicle.utilization || 60) * 8,
  );
  const confidence = Math.max(62, Math.min(96, Math.round(94 - risk * 0.7 - (needsCharge ? 8 : 0))));

  return {
    vehicle,
    zone,
    charger,
    expectedRevenue,
    confidence,
    needsCharge,
    chargeTarget: needsCharge ? 82 : Math.max(70, Math.min(90, battery + 8)),
    riskLabel: risk > 18 || battery < 35 ? 'Elevated' : needsCharge ? 'Managed' : 'Low',
    status: needsCharge ? 'Charge First' : isParked ? 'Stage Tonight' : 'Monitor Route',
  };
}

function Metric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function PlanCard({ plan, onQueueCommand, onShowMap }) {
  const { vehicle, zone, charger, needsCharge } = plan;
  const vehicleName = vehicle.name || vehicle.display_name || vehicle.id;
  const actionText = needsCharge
    ? `Charge ${vehicleName} to ${plan.chargeTarget}% at ${charger?.name}, then stage near ${zone?.name}`
    : `Stage ${vehicleName} near ${zone?.name} for tonight's demand window`;

  const handleApprove = () => {
    onQueueCommand?.(
      `Dispatch plan approved: ${actionText}. Expected revenue ${formatCurrency(plan.expectedRevenue)}.`,
      plan.riskLabel === 'Elevated' ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase text-sky-200">
              {plan.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
              plan.riskLabel === 'Elevated'
                ? 'border-rose-400/25 bg-rose-400/10 text-rose-200'
                : plan.riskLabel === 'Managed'
                  ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
            }`}>
              {plan.riskLabel} Risk
            </span>
          </div>
          <h3 className="truncate text-2xl font-black tracking-tight">{vehicleName}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{actionText}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
          <button
            type="button"
            onClick={handleApprove}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onShowMap}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10"
          >
            Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Target Zone" value={zone?.name || 'Unavailable'} tone="text-sky-300" />
        <Metric label="Distance" value={`${zone?.distance || 0} mi`} />
        <Metric label="Revenue" value={formatCurrency(plan.expectedRevenue)} tone="text-emerald-300" />
        <Metric label="Confidence" value={`${plan.confidence}%`} tone="text-violet-300" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Battery Plan</p>
          <p className="mt-2 text-sm font-bold text-slate-100">
            {needsCharge ? `Charge to ${plan.chargeTarget}% before dispatch` : `Current battery ${vehicle.battery}% is dispatch-ready`}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Nearest Charger</p>
          <p className="mt-2 text-sm font-bold text-slate-100">
            {charger ? `${charger.name} - ${charger.distance} mi, ${charger.occupancy}% occupied` : 'Unavailable'}
          </p>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">Tesla Boundary</p>
          <p className="mt-2 text-sm font-bold text-amber-50">
            ROBOAGENT plans; Tesla controls autonomous execution.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function DispatchPlannerPanel({
  fleet = [],
  demandZones = [],
  chargingStations = [],
  onQueueCommand,
  onShowMap,
}) {
  const plans = fleet
    .map((vehicle) => planForVehicle(vehicle, demandZones, chargingStations))
    .sort((a, b) => b.expectedRevenue - a.expectedRevenue);

  const totalRevenue = plans.reduce((sum, plan) => sum + plan.expectedRevenue, 0);
  const chargeFirst = plans.filter((plan) => plan.needsCharge).length;
  const avgConfidence = plans.length
    ? Math.round(plans.reduce((sum, plan) => sum + plan.confidence, 0) / plans.length)
    : 0;
  const topZone = plans[0]?.zone?.name || 'Unavailable';

  const handleGenerate = () => {
    onQueueCommand?.(
      `Tonight dispatch plan generated: ${plans.length} vehicles, ${formatCurrency(totalRevenue)} projected revenue, top zone ${topZone}.`,
      'HIGH',
    );
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Projected Revenue" value={formatCurrency(totalRevenue)} tone="text-emerald-300" />
        <Metric label="Charge First" value={chargeFirst} tone={chargeFirst ? 'text-amber-300' : 'text-slate-100'} />
        <Metric label="Avg Confidence" value={`${avgConfidence}%`} tone="text-violet-300" />
        <Metric label="Top Zone" value={topZone} tone="text-sky-300" />
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/15">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              AI Dispatch Planner
            </p>
            <h2 className="text-2xl font-black tracking-tight">Tonight's Fleet Plan</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              ROBOAGENT can recommend where each vehicle should stage, whether it should charge first, and what revenue window to expect. The app is planning operator intent; Tesla still controls any autonomous driving capability.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
          >
            Generate Plan
          </button>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.vehicle.vin || plan.vehicle.id}
            plan={plan}
            onQueueCommand={onQueueCommand}
            onShowMap={onShowMap}
          />
        ))}
      </div>
    </section>
  );
}
