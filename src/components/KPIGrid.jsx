import { Metric } from '../ui';

export default function KPIGrid({
  totalRevenue = 0,
  systemLoad = 0,
  avgAnomalyRisk = 0,
  fleetSize = 0,
  activeCount = 0,
}) {
  const riskLabel = avgAnomalyRisk > 15 ? 'High' : avgAnomalyRisk > 8 ? 'Medium' : 'Low';
  const riskTone = avgAnomalyRisk > 15 ? 'critical' : avgAnomalyRisk > 8 ? 'warning' : 'success';

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <Metric label="Revenue" value={`$${totalRevenue.toLocaleString()}`} tone="success" />
      <Metric label="Fleet load" value={`${systemLoad}%`} tone="warning" />
      <Metric label="Ready" value={`${activeCount}/${fleetSize}`} tone="info" />
      <Metric label="Risk" value={riskLabel} tone={riskTone} />
    </div>
  );
}
