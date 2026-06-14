import { AppCard, AppSection } from '../components/shell';
import { colors, semantic, typography } from '../design/roboagentTokens';

function formatValue(value, suffix = '') {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()}${suffix}` : 'Unavailable';
}

function readinessFor(vehicle) {
  const battery = Number(vehicle?.battery);
  const chargingState = `${vehicle?.chargingState || ''}`.toLowerCase();
  const isCharging = chargingState.includes('charging');

  if (isCharging) {
    return {
      label: 'Charging',
      accent: colors.primary,
      bg: colors.primaryLight,
      action: 'Keep charging until dispatch window',
    };
  }

  if (!Number.isFinite(battery)) {
    return {
      label: 'Needs Sync',
      accent: semantic.caution,
      bg: semantic.cautionBg,
      action: 'Refresh telemetry before assigning',
    };
  }

  if (battery < 35) {
    return {
      label: 'Charge Now',
      accent: semantic.alert,
      bg: semantic.alertBg,
      action: 'Route to nearest charger',
    };
  }

  if (battery < 55) {
    return {
      label: 'Charge Soon',
      accent: semantic.caution,
      bg: semantic.cautionBg,
      action: 'Use for short trips only',
    };
  }

  return {
    label: 'Dispatch Ready',
    accent: semantic.positive,
    bg: semantic.positiveBg,
    action: 'Eligible for active assignment',
  };
}

function estimatedRange(vehicle) {
  const battery = Number(vehicle?.battery);
  if (!Number.isFinite(battery)) return null;

  const usableRange = vehicle?.isReal ? 238 : 265;
  return Math.round((battery / 100) * usableRange);
}

function BatteryBar({ value }) {
  const battery = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
  const color = battery < 35 ? 'bg-rose-500' : battery < 55 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${battery}%` }} />
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <AppCard variant="metric">
      <p className={typography.label}>{label}</p>
      <p className={`mt-2 ${typography.metricSm}`} style={{ color: accent }}>{value}</p>
    </AppCard>
  );
}

function VehicleChargeRow({ vehicle, onQueueCommand }) {
  const readiness = readinessFor(vehicle);
  const range = estimatedRange(vehicle);

  const handlePlan = () => {
    onQueueCommand?.(
      `Charging plan requested for ${vehicle.name || vehicle.display_name || vehicle.id}: ${readiness.action}`,
      readiness.label === 'Charge Now' ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <AppCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
              style={{ backgroundColor: readiness.bg, color: readiness.accent }}
            >
              {readiness.label}
            </span>
            {vehicle.isReal && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                Tesla
              </span>
            )}
          </div>
          <h3 className={`truncate ${typography.cardTitle}`}>
            {vehicle.name || vehicle.display_name || vehicle.id}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-600">{readiness.action}</p>
        </div>

        <button
          type="button"
          onClick={handlePlan}
          className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.99]"
          style={{ backgroundColor: colors.primary }}
        >
          Plan Charge
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div>
          <p className={typography.label}>Battery</p>
          <p className={`mt-1 ${typography.bodyMd}`}>{formatValue(vehicle.battery, '%')}</p>
        </div>
        <div>
          <p className={typography.label}>Est. Range</p>
          <p className={`mt-1 ${typography.bodyMd}`}>{range ? `${range} mi` : 'Unavailable'}</p>
        </div>
        <div>
          <p className={typography.label}>Charging</p>
          <p className={`mt-1 truncate ${typography.bodyMd}`}>{vehicle.chargingState || 'Unavailable'}</p>
        </div>
        <div>
          <p className={typography.label}>Utilization</p>
          <p className={`mt-1 ${typography.bodyMd}`}>{formatValue(vehicle.utilization, '%')}</p>
        </div>
      </div>

      <div className="mt-4">
        <BatteryBar value={vehicle.battery} />
      </div>
    </AppCard>
  );
}

export default function ChargingReadinessPanel({ fleet = [], onQueueCommand }) {
  const enriched = fleet.map((vehicle) => ({
    ...vehicle,
    readiness: readinessFor(vehicle),
    range: estimatedRange(vehicle),
  }));

  const dispatchReady = enriched.filter((vehicle) => vehicle.readiness.label === 'Dispatch Ready').length;
  const chargeNow = enriched.filter((vehicle) => vehicle.readiness.label === 'Charge Now').length;
  const charging = enriched.filter((vehicle) => vehicle.readiness.label === 'Charging').length;
  const avgBattery = enriched.length
    ? Math.round(enriched.reduce((sum, vehicle) => sum + (Number(vehicle.battery) || 0), 0) / enriched.length)
    : 0;

  return (
    <AppSection title="Charging" tier="primary" aria-label="Fleet charging readiness">
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Dispatch Ready" value={dispatchReady} accent={semantic.positive} />
        <MetricCard label="Charging" value={charging} accent={colors.primary} />
        <MetricCard label="Charge Now" value={chargeNow} accent={chargeNow ? semantic.alert : colors.inkMuted} />
        <MetricCard label="Avg Battery" value={`${avgBattery}%`} accent={avgBattery < 45 ? semantic.caution : semantic.positive} />
      </div>

      <AppCard variant="subdued" className="mb-4">
        <p className={typography.bodyMd}>
          Tesla charge telemetry translated into dispatch decisions. Charge controls stage behind confirmation flow.
        </p>
      </AppCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {enriched
          .sort((a, b) => (Number(a.battery) || 0) - (Number(b.battery) || 0))
          .map((vehicle) => (
            <VehicleChargeRow
              key={vehicle.vin || vehicle.id}
              vehicle={vehicle}
              onQueueCommand={onQueueCommand}
            />
          ))}
      </div>
    </AppSection>
  );
}
