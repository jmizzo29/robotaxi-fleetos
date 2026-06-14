import { useEffect, useMemo, useState } from 'react';
import {
  buildCleaningMaintenancePlan,
  buildFleetHealthSummary,
  buildOperationalInsights,
  formatCurrency,
  formatPercent,
} from '../services/robotaxiOperationsService';
import { readRevenueRecords, syncRevenueFromBackend } from '../services/revenueService';
import { AppCard, AppSection } from '../components/shell';
import { colors, semantic, typography } from '../design/roboagentTokens';

function toneForScore(score) {
  if (score >= 84) return semantic.positive;
  if (score >= 72) return semantic.caution;
  return semantic.alert;
}

function badgeStyle(priority) {
  if (priority === 'HIGH') return { border: 'border-rose-200', bg: semantic.alertBg, text: semantic.alert };
  if (priority === 'NORMAL') return { border: 'border-amber-200', bg: semantic.cautionBg, text: semantic.caution };
  return { border: 'border-emerald-200', bg: semantic.positiveBg, text: semantic.positive };
}

function Metric({ label, value, helper, accent = colors.ink }) {
  return (
    <AppCard variant="metric">
      <p className={typography.label}>{label}</p>
      <p className={`mt-2 ${typography.metricSm}`} style={{ color: accent }}>{value}</p>
      {helper && <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{helper}</p>}
    </AppCard>
  );
}

function ScoreBar({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  const color = score >= 84 ? 'bg-emerald-500' : score >= 72 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function EstimateCard({ item, onQueueCommand }) {
  return (
    <AppCard>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={typography.label}>{item.ownership?.tag || item.vehicle.id || 'Fleet'}</p>
          <h3 className={`mt-1 truncate ${typography.cardTitle}`}>{item.name}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{item.revenueSource} · {Math.round(item.confidence)}% confidence</p>
        </div>
        <span className="text-3xl font-bold" style={{ color: toneForScore(item.healthScore) }}>{item.healthScore}</span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-slate-500">Fleet health</span>
          <span className="font-bold text-slate-900">{item.healthScore}/100</span>
        </div>
        <ScoreBar value={item.healthScore} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Monthly Gross" value={formatCurrency(item.monthlyEstimate)} accent={colors.primary} />
        <Metric label="Monthly Net" value={formatCurrency(item.netEstimate)} accent={item.netEstimate >= 0 ? semantic.positive : semantic.alert} />
        <Metric label="Utilization" value={formatPercent(item.utilization)} />
        <Metric label="Daily Est." value={formatCurrency(item.dailyEstimate)} />
      </div>

      <button
        type="button"
        onClick={() => onQueueCommand?.(
          `AI earnings review for ${item.name}: ${formatCurrency(item.monthlyEstimate)} gross, ${formatCurrency(item.netEstimate)} net, ${Math.round(item.confidence)}% confidence.`,
          item.healthScore < 76 ? 'HIGH' : 'NORMAL',
        )}
        className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition"
        style={{ backgroundColor: colors.primary }}
      >
        Queue AI Earnings Review
      </button>
    </AppCard>
  );
}

function MaintenanceRow({ item, onQueueCommand }) {
  const badge = badgeStyle(item.priority);
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${badge.border}`} style={{ backgroundColor: badge.bg, color: badge.text }}>
              {item.priority}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase text-slate-600">
              {item.window}
            </span>
          </div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{item.task}</p>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{item.reason}</p>
        </div>
        <button
          type="button"
          onClick={() => onQueueCommand?.(
            `Schedule ${item.task} for ${item.name}: ${item.reason}`,
            item.priority,
          )}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          Schedule
        </button>
      </div>
    </div>
  );
}

function InsightCard({ alert }) {
  const isWarning = alert.severity === 'WARNING';
  return (
    <article className={`rounded-2xl border p-4 ${isWarning ? 'border-amber-200 bg-amber-50' : 'border-sky-200 bg-sky-50'}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${isWarning ? 'text-amber-800' : 'text-sky-800'}`}>{alert.severity}</p>
      <h3 className={`mt-2 ${typography.cardTitle}`}>{alert.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{alert.detail}</p>
    </article>
  );
}

export default function FleetHealthDashboard({ fleet = [], onQueueCommand }) {
  const [revenueRecords, setRevenueRecords] = useState(() => readRevenueRecords());

  useEffect(() => {
    const refresh = () => setRevenueRecords(readRevenueRecords());
    syncRevenueFromBackend().then(setRevenueRecords).catch(() => setRevenueRecords(readRevenueRecords()));
    window.addEventListener('fleetos-revenue-updated', refresh);
    return () => window.removeEventListener('fleetos-revenue-updated', refresh);
  }, []);

  // Demo/simulated vehicles are excluded from earnings estimates and health KPIs.
  const realFleet = useMemo(() => fleet.filter((vehicle) => vehicle.isReal), [fleet]);
  const demoCount = fleet.length - realFleet.length;
  const summary = useMemo(() => buildFleetHealthSummary(realFleet, revenueRecords), [realFleet, revenueRecords]);
  const maintenancePlan = useMemo(() => buildCleaningMaintenancePlan(realFleet, revenueRecords), [realFleet, revenueRecords]);
  const insights = useMemo(() => buildOperationalInsights(realFleet, revenueRecords), [realFleet, revenueRecords]);

  return (
    <AppSection title="Fleet Health" tier="primary" aria-label="Fleet health dashboard">
      {demoCount > 0 && (
        <AppCard className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">
            {demoCount} demo vehicle{demoCount === 1 ? ' is' : 's are'} excluded from earnings estimates and health scores.
            {realFleet.length === 0 && ' Connect a Tesla to see real fleet health.'}
          </p>
        </AppCard>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Smart Gross" value={formatCurrency(summary.totalMonthly)} accent={colors.primary} helper="Monthly estimate" />
        <Metric label="Smart Net" value={formatCurrency(summary.totalNet)} accent={summary.totalNet >= 0 ? semantic.positive : semantic.alert} />
        <Metric label="Utilization" value={formatPercent(summary.avgUtilization)} accent={semantic.caution} />
        <Metric label="Fleet Health" value={`${Math.round(summary.avgHealth)}/100`} accent={toneForScore(summary.avgHealth)} />
        <Metric label="AI Confidence" value={formatPercent(summary.confidence)} accent={colors.primaryDark} />
      </div>

      <AppCard variant="subdued" className="mb-4">
        <p className={typography.bodyMd}>
          ROBOAGENT estimates earnings from utilization, telemetry, battery, health, and owner-entered revenue. The scheduler turns those signals into cleaning and maintenance work before vehicles lose availability.
        </p>
      </AppCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AppCard>
          <p className={`mb-4 ${typography.label}`}>AI Insights & Alerts</p>
          <div className="grid grid-cols-1 gap-3">
            {realFleet.length > 0 ? (
              insights.alerts.map((alert) => (
                <InsightCard key={alert.title} alert={alert} />
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">Insights become available once a real Tesla is connected.</p>
            )}
          </div>
        </AppCard>

        <AppCard>
          <p className={`mb-4 ${typography.label}`}>Cleaning & Maintenance Queue</p>
          <div className="space-y-3">
            {maintenancePlan.slice(0, 5).map((item) => (
              <MaintenanceRow
                key={item.vehicle.vin || item.vehicle.id}
                item={item}
                onQueueCommand={onQueueCommand}
              />
            ))}
          </div>
        </AppCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {summary.estimates
          .sort((a, b) => b.netEstimate - a.netEstimate)
          .map((item) => (
            <EstimateCard
              key={item.vehicle.vin || item.vehicle.id}
              item={item}
              onQueueCommand={onQueueCommand}
            />
          ))}
      </div>
    </AppSection>
  );
}
