import { getVehicleOwnership } from '../data/vehicleOwnership';
import { revenueForVehicle } from './revenueService';

export function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return '$0';
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return '0%';
  return `${Math.round(value)}%`;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function vehicleName(vehicle) {
  return vehicle?.name || vehicle?.display_name || vehicle?.id || 'Vehicle';
}

export function estimateVehicleOperations(vehicle, revenueRecords = []) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
  const importedRevenue = revenueForVehicle(vehicle, revenueRecords);
  const utilization = clamp(vehicle.utilization ?? (vehicle.status === 'PARKED' ? 42 : 68));
  const battery = clamp(vehicle.battery);
  const anomalyRisk = clamp(vehicle.anomalyRisk);
  const maintenanceScore = clamp(vehicle.maintenanceScore || 82);
  const realTelemetryBonus = vehicle.isReal ? 1.08 : 1;
  const marketRate = vehicle.isReal ? 52 : 46;
  const activeHours = 4 + utilization / 9;
  const availabilityFactor = battery < 35 ? 0.68 : battery < 55 ? 0.84 : 1;
  const healthFactor = 0.75 + maintenanceScore / 400;
  const riskPenalty = 1 - anomalyRisk / 240;
  const dailyEstimate = Math.round(
    marketRate * activeHours * availabilityFactor * healthFactor * riskPenalty * realTelemetryBonus,
  );
  const monthlyEstimate = importedRevenue || Math.round(dailyEstimate * 26);
  const chargingCost = Math.max(80, Math.round(monthlyEstimate * 0.075));
  const cleaningCost = Math.round((vehicle.passengers || 1) * 36 + utilization * 1.2);
  const maintenanceReserve = Math.round(monthlyEstimate * ((100 - maintenanceScore) / 100) * 0.22 + 90);
  const payment = Number(ownership.monthlyPayment) || 0;
  const totalCost = chargingCost + cleaningCost + maintenanceReserve + payment;
  const netEstimate = monthlyEstimate - totalCost;
  const confidence = clamp(
    (vehicle.isReal ? 76 : 58) +
    (importedRevenue ? 14 : 0) +
    (vehicle.syncedAt ? 8 : 0) -
    (anomalyRisk > 20 ? 8 : 0),
  );

  return {
    vehicle,
    ownership,
    name: vehicleName(vehicle),
    utilization,
    battery,
    dailyEstimate,
    monthlyEstimate,
    revenueSource: importedRevenue ? 'Ledger' : 'Smart estimate',
    totalCost,
    netEstimate,
    confidence,
    cleaningCost,
    maintenanceReserve,
    healthScore: Math.round((battery * 0.24) + (maintenanceScore * 0.34) + ((100 - anomalyRisk) * 0.24) + (utilization * 0.18)),
  };
}

export function buildCleaningMaintenancePlan(fleet = [], revenueRecords = []) {
  return fleet.map((vehicle) => {
    const ops = estimateVehicleOperations(vehicle, revenueRecords);
    const passengerLoad = Number(vehicle.passengers) || 0;
    const needsCleaning = passengerLoad >= 2 || ops.utilization > 78 || vehicle.status === 'IN SERVICE';
    const needsMaintenance = ops.healthScore < 76 || Number(vehicle.maintenanceScore || 0) < 78 || Number(vehicle.anomalyRisk || 0) > 18;
    const priority = needsMaintenance ? 'HIGH' : needsCleaning ? 'NORMAL' : 'LOW';
    const task = needsMaintenance
      ? 'Maintenance inspection'
      : needsCleaning
        ? 'Interior reset and exterior check'
        : 'Routine readiness check';
    const window = vehicle.status === 'PARKED' || vehicle.status === 'IDLE'
      ? 'Next available idle block'
      : 'After current trip window';

    return {
      ...ops,
      task,
      window,
      priority,
      reason: needsMaintenance
        ? 'Health or anomaly signals justify an inspection before heavy utilization.'
        : needsCleaning
          ? 'Passenger load and utilization suggest a quality reset is useful.'
          : 'No urgent service signal; keep the vehicle in the normal cadence.',
    };
  }).sort((a, b) => {
    const priorityScore = { HIGH: 3, NORMAL: 2, LOW: 1 };
    return priorityScore[b.priority] - priorityScore[a.priority] || a.healthScore - b.healthScore;
  });
}

export function buildFleetHealthSummary(fleet = [], revenueRecords = []) {
  const estimates = fleet.map((vehicle) => estimateVehicleOperations(vehicle, revenueRecords));
  const count = estimates.length || 1;
  const totalMonthly = estimates.reduce((sum, item) => sum + item.monthlyEstimate, 0);
  const totalNet = estimates.reduce((sum, item) => sum + item.netEstimate, 0);
  const avgUtilization = estimates.reduce((sum, item) => sum + item.utilization, 0) / count;
  const avgHealth = estimates.reduce((sum, item) => sum + item.healthScore, 0) / count;
  const highRisk = estimates.filter((item) => item.healthScore < 76 || Number(item.vehicle.anomalyRisk || 0) > 18);

  return {
    estimates,
    totalMonthly,
    totalNet,
    avgUtilization,
    avgHealth,
    highRisk,
    confidence: estimates.reduce((sum, item) => sum + item.confidence, 0) / count,
  };
}

export function buildOperationalInsights(fleet = [], revenueRecords = []) {
  const summary = buildFleetHealthSummary(fleet, revenueRecords);
  const plan = buildCleaningMaintenancePlan(fleet, revenueRecords);
  const weakest = [...summary.estimates].sort((a, b) => a.healthScore - b.healthScore)[0];
  const bestEarner = [...summary.estimates].sort((a, b) => b.netEstimate - a.netEstimate)[0];
  const alerts = [];

  if (weakest && weakest.healthScore < 76) {
    alerts.push({
      severity: 'WARNING',
      title: `${weakest.name} needs a health review`,
      detail: `Health score is ${weakest.healthScore}/100. Prioritize ${plan.find((item) => item.name === weakest.name)?.task || 'inspection'}.`,
    });
  }

  if (bestEarner) {
    alerts.push({
      severity: 'INFO',
      title: `${bestEarner.name} is the best earnings candidate`,
      detail: `${formatCurrency(bestEarner.netEstimate)} estimated monthly net with ${Math.round(bestEarner.confidence)}% confidence.`,
    });
  }

  if (summary.avgUtilization < 55) {
    alerts.push({
      severity: 'WARNING',
      title: 'Fleet utilization is below target',
      detail: `Average utilization is ${formatPercent(summary.avgUtilization)}. Consider staging idle vehicles near demand zones.`,
    });
  }

  return { summary, plan, alerts };
}
