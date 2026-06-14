import { AppCard, AppSection } from '../components/shell';
import { colors, semantic, spacing, typography } from '../design/roboagentTokens';

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

function Metric({ label, value, tone }) {
  return (
    <AppCard variant="metric" className="!p-4">
      <p className={typography.label}>{label}</p>
      <p className={`mt-2 ${typography.metricSm}`} style={tone ? { color: tone } : undefined}>{value}</p>
    </AppCard>
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

  const riskStyle = plan.riskLabel === 'Elevated'
    ? { borderColor: `${semantic.alert}33`, backgroundColor: semantic.alertBg, color: semantic.alert }
    : plan.riskLabel === 'Managed'
      ? { borderColor: `${semantic.caution}33`, backgroundColor: semantic.cautionBg, color: semantic.caution }
      : { borderColor: `${semantic.positive}33`, backgroundColor: semantic.positiveBg, color: semantic.positive };

  return (
    <AppCard className="p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase"
              style={{ borderColor: `${colors.primary}33`, backgroundColor: colors.primaryLight, color: colors.primary }}
            >
              {plan.status}
            </span>
            <span className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase" style={riskStyle}>
              {plan.riskLabel} Risk
            </span>
          </div>
          <h3 className={`truncate ${typography.pageTitle}`}>{vehicleName}</h3>
          <p className={`mt-1 ${typography.bodyMd} text-slate-600`}>{actionText}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
          <button
            type="button"
            onClick={handleApprove}
            className="rounded-[14px] border px-3 py-2 text-sm font-bold transition active:opacity-90"
            style={{ borderColor: `${semantic.positive}33`, backgroundColor: semantic.positiveBg, color: semantic.positive }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onShowMap}
            className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition active:bg-slate-100"
          >
            Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Target Zone" value={zone?.name || 'Unavailable'} tone={colors.primary} />
        <Metric label="Distance" value={`${zone?.distance || 0} mi`} />
        <Metric label="Revenue" value={formatCurrency(plan.expectedRevenue)} tone={semantic.positive} />
        <Metric label="Confidence" value={`${plan.confidence}%`} tone={colors.primaryDark} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <AppCard variant="subdued" className="p-4">
          <p className={typography.label}>Battery Plan</p>
          <p className={`mt-2 ${typography.bodyMd}`}>
            {needsCharge ? `Charge to ${plan.chargeTarget}% before dispatch` : `Current battery ${vehicle.battery}% is dispatch-ready`}
          </p>
        </AppCard>
        <AppCard variant="subdued" className="p-4">
          <p className={typography.label}>Nearest Charger</p>
          <p className={`mt-2 ${typography.bodyMd}`}>
            {charger ? `${charger.name} - ${charger.distance} mi, ${charger.occupancy}% occupied` : 'Unavailable'}
          </p>
        </AppCard>
        <AppCard variant="subdued" className="p-4" style={{ borderLeft: `4px solid ${semantic.caution}` }}>
          <p className={typography.label}>Tesla Boundary</p>
          <p className={`mt-2 ${typography.bodyMd}`}>
            ROBOAGENT plans; Tesla controls autonomous execution.
          </p>
        </AppCard>
      </div>
    </AppCard>
  );
}

export default function DispatchPlannerPanel({
  fleet = [],
  demandZones = [],
  chargingStations = [],
  onQueueCommand,
  onShowMap,
}) {
  const realFleet = fleet.filter((vehicle) => vehicle.isReal);
  const planningFleet = realFleet.length > 0 ? realFleet : fleet.filter((vehicle) => !vehicle.isReal);
  const demoCount = fleet.length - realFleet.length;
  const plans = planningFleet
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
    <section className={spacing.stackSm}>
      {demoCount > 0 && realFleet.length === 0 && (
        <AppCard className="p-4 text-sm font-semibold" style={{ backgroundColor: semantic.cautionBg, color: semantic.caution }}>
          Operating fleet plan shown. Connect Tesla to generate plans from live vehicles.
        </AppCard>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Projected Revenue" value={formatCurrency(totalRevenue)} tone={semantic.positive} />
        <Metric label="Charge First" value={chargeFirst} tone={chargeFirst ? semantic.caution : undefined} />
        <Metric label="Avg Confidence" value={`${avgConfidence}%`} tone={colors.primary} />
        <Metric label="Top Zone" value={topZone} tone={colors.primary} />
      </div>

      <AppSection title="Tonight's Fleet Plan" tier="secondary" className="!mt-0">
        <AppCard variant="alert">
          <p className={typography.sectionSm}>AI Dispatch Planner</p>
          <p className={`mt-3 ${typography.cardTitle}`}>Stage, charge, and revenue windows for tonight</p>
          <p className={`mt-2 ${typography.bodyMd} text-slate-600`}>
            ROBOAGENT recommends where each vehicle should stage and whether it should charge first. Tesla controls autonomous execution.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 w-full rounded-[14px] px-4 py-3.5 text-sm font-bold text-white transition active:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            Generate Plan
          </button>
        </AppCard>
      </AppSection>

      <ul className={spacing.stackSm}>
        {plans.map((plan) => (
          <li key={plan.vehicle.vin || plan.vehicle.id}>
            <PlanCard plan={plan} onQueueCommand={onQueueCommand} onShowMap={onShowMap} />
          </li>
        ))}
      </ul>
    </section>
  );
}
