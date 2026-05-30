import { getVehicleOwnership } from '../data/vehicleOwnership';

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
  if (score >= 84) return 'text-emerald-300';
  if (score >= 70) return 'text-amber-300';
  return 'text-rose-300';
}

function badgeTone(status) {
  if (status === 'Ready') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
  if (status === 'Needs Review') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/25 bg-rose-400/10 text-rose-200';
}

function Metric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 84 ? 'bg-emerald-300' : score >= 70 ? 'bg-amber-300' : 'bg-rose-300';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-950">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </div>
  );
}

function ReadinessCard({ item, onQueueCommand }) {
  const { vehicle, ownership, score, status, categories } = item;
  const vehicleName = vehicle.name || vehicle.display_name || vehicle.id;

  const handleReview = () => {
    onQueueCommand?.(
      `Driverless readiness review requested for ${vehicleName}: ${score}/100, status ${status}.`,
      status === 'Blocked' ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${badgeTone(status)}`}>
              {status}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
              {ownership.tag || vehicle.id}
            </span>
          </div>
          <h3 className="truncate text-2xl font-black tracking-tight">{vehicleName}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {ownership.modelYear || 'Unknown'} {ownership.model || 'Vehicle'} - robotaxi readiness estimate
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          className="rounded-md border border-violet-400/30 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
        >
          AI Review
        </button>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-semibold text-slate-400">Readiness Score</span>
          <span className={`text-3xl font-black ${toneForScore(score)}`}>{score}</span>
        </div>
        <ScoreBar score={score} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map(([label, value, detail]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className={`text-sm font-black ${toneForScore(value)}`}>{Math.round(value)}</p>
            </div>
            <ScoreBar score={value} />
            <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
          </div>
        ))}
      </div>
    </article>
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
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Avg Readiness" value={`${average}/100`} tone={toneForScore(average)} />
        <Metric label="Ready" value={ready} tone="text-emerald-300" />
        <Metric label="Needs Review" value={review} tone={review ? 'text-amber-300' : 'text-slate-100'} />
        <Metric label="Blocked" value={blocked} tone={blocked ? 'text-rose-300' : 'text-slate-100'} />
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/15">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Robotaxi-Ready, Tesla-Honest
        </p>
        <h2 className="text-2xl font-black tracking-tight">Driverless Readiness Score</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          ROBOAGENT can evaluate whether a vehicle is operationally ready for a future driverless network: energy, telemetry, maintenance, anomaly risk, compliance, and autonomy dependency. Tesla still controls whether autonomous dispatch is available and where it can operate.
        </p>
      </article>

      <div className="grid grid-cols-1 gap-4">
        {readiness.map((item) => (
          <ReadinessCard
            key={item.vehicle.vin || item.vehicle.id}
            item={item}
            onQueueCommand={onQueueCommand}
          />
        ))}
      </div>
    </section>
  );
}
