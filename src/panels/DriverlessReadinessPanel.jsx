import { getVehicleOwnership } from '../data/vehicleOwnership';
import { AppCard, AppSection } from '../components/shell';
import { colors, semantic, typography } from '../design/roboagentTokens';

function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function scoreVehicle(vehicle) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
  const batteryScore = Math.min(100, Math.max(0, Number(vehicle.battery) || 0));
  const telemetryScore = vehicle.isReal
    ? vehicle.syncedAt || vehicle.gpsAsOf
      ? 96
      : 70
    : 82;
  const maintenanceScore = Number(vehicle.maintenanceScore) || 80;
  const anomalyScore = Math.max(0, 100 - (Number(vehicle.anomalyRisk) || 0) * 3);
  const insuranceDays = daysUntil(ownership.insuranceRenewal);
  const complianceScore = insuranceDays === null ? 72 : insuranceDays < 30 ? 48 : insuranceDays < 90 ? 78 : 94;
  const autonomyScore = vehicle.isReal
    ? `${ownership.model || ''}`.includes('Tesla')
      ? 76
      : 62
    : 88;

  const categories = [
    ['Battery', batteryScore, batteryScore >= 55 ? 'Enough energy for dispatch window' : 'Charge before dispatch'],
    ['Telemetry', telemetryScore, telemetryScore >= 90 ? 'Recent live telemetry available' : 'Refresh vehicle telemetry'],
    ['Maintenance', maintenanceScore, maintenanceScore >= 85 ? 'Maintenance score supports service' : 'Review maintenance readiness'],
    ['Risk', anomalyScore, anomalyScore >= 85 ? 'Low anomaly risk' : 'AI review recommended'],
    ['Compliance', complianceScore, complianceScore >= 85 ? 'Insurance and registration look current' : 'Check owner documents'],
    ['Autonomy', autonomyScore, 'Tesla controls autonomous eligibility and execution'],
  ];

  const score = Math.round(categories.reduce((sum, [, value]) => sum + value, 0) / categories.length);
  const blockers = categories.filter(([, value]) => value < 70).length;
  const status = blockers > 1 || score < 70 ? 'Blocked' : blockers === 1 || score < 84 ? 'Needs Review' : 'Ready';

  return {
    vehicle,
    ownership,
    categories,
    score,
    blockers,
    status,
  };
}

function toneForScore(score) {
  if (score >= 84) return semantic.positive;
  if (score >= 70) return semantic.caution;
  return semantic.alert;
}

function badgeStyle(status) {
  if (status === 'Ready') return { bg: semantic.positiveBg, color: semantic.positive };
  if (status === 'Needs Review') return { bg: semantic.cautionBg, color: semantic.caution };
  return { bg: semantic.alertBg, color: semantic.alert };
}

function MetricCard({ label, value, accent }) {
  return (
    <AppCard variant="metric">
      <p className={typography.label}>{label}</p>
      <p className={`mt-2 ${typography.metricSm}`} style={{ color: accent }}>{value}</p>
    </AppCard>
  );
}

function ScoreBar({ score }) {
  const color = score >= 84 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </div>
  );
}

function ReadinessCard({ item, onQueueCommand }) {
  const { vehicle, ownership, score, status, categories } = item;
  const vehicleName = vehicle.name || vehicle.display_name || vehicle.id;
  const badge = badgeStyle(status);

  const handleReview = () => {
    onQueueCommand?.(
      `Driverless readiness review requested for ${vehicleName}: ${score}/100, status ${status}.`,
      status === 'Blocked' ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <AppCard>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-600">
              {ownership.tag || vehicle.id}
            </span>
          </div>
          <h3 className={`truncate ${typography.cardTitle}`}>{vehicleName}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {ownership.modelYear || 'Unknown'} {ownership.model || 'Vehicle'} · robotaxi readiness estimate
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.99]"
          style={{ backgroundColor: colors.primary }}
        >
          AI Review
        </button>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-semibold text-slate-500">Readiness Score</span>
          <span className={`text-3xl font-bold`} style={{ color: toneForScore(score) }}>{score}</span>
        </div>
        <ScoreBar score={score} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map(([label, value, detail]) => (
          <div key={label} className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className={typography.label}>{label}</p>
              <p className="text-sm font-bold" style={{ color: toneForScore(value) }}>{Math.round(value)}</p>
            </div>
            <ScoreBar score={value} />
            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{detail}</p>
          </div>
        ))}
      </div>
    </AppCard>
  );
}

export default function DriverlessReadinessPanel({ fleet = [], onQueueCommand }) {
  const readiness = fleet.map(scoreVehicle).sort((a, b) => b.score - a.score);
  const ready = readiness.filter((item) => item.status === 'Ready').length;
  const review = readiness.filter((item) => item.status === 'Needs Review').length;
  const blocked = readiness.filter((item) => item.status === 'Blocked').length;
  const average = readiness.length
    ? Math.round(readiness.reduce((sum, item) => sum + item.score, 0) / readiness.length)
    : 0;

  return (
    <AppSection title="Driverless Readiness" tier="primary" aria-label="Driverless readiness scores">
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Avg Readiness" value={`${average}/100`} accent={toneForScore(average)} />
        <MetricCard label="Ready" value={ready} accent={semantic.positive} />
        <MetricCard label="Needs Review" value={review} accent={review ? semantic.caution : colors.inkMuted} />
        <MetricCard label="Blocked" value={blocked} accent={blocked ? semantic.alert : colors.inkMuted} />
      </div>

      <AppCard variant="subdued" className="mb-4">
        <p className={typography.bodyMd}>
          ROBOAGENT scores operational readiness across energy, telemetry, maintenance, risk, compliance, and autonomy dependency. Tesla still controls autonomous dispatch eligibility.
        </p>
      </AppCard>

      <div className="grid grid-cols-1 gap-4">
        {readiness.map((item) => (
          <ReadinessCard
            key={item.vehicle.vin || item.vehicle.id}
            item={item}
            onQueueCommand={onQueueCommand}
          />
        ))}
      </div>
    </AppSection>
  );
}
