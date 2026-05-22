import { useEffect, useMemo, useState } from 'react';
import {
  buildCleaningMaintenancePlan,
  buildFleetHealthSummary,
  buildOperationalInsights,
  formatCurrency,
  formatPercent,
} from '../services/robotaxiOperationsService';
import { readRevenueRecords, syncRevenueFromBackend } from '../services/revenueService';

function toneForScore(score) {
  if (score >= 84) return 'text-emerald-300';
  if (score >= 72) return 'text-amber-300';
  return 'text-rose-300';
}

function badgeTone(priority) {
  if (priority === 'HIGH') return 'border-rose-400/25 bg-rose-400/10 text-rose-200';
  if (priority === 'NORMAL') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
}

function Metric({ label, value, helper, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>}
    </div>
  );
}

function ScoreBar({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  const color = score >= 84 ? 'bg-emerald-300' : score >= 72 ? 'bg-amber-300' : 'bg-rose-300';
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-950">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function EstimateCard({ item, onQueueCommand }) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            {item.ownership?.tag || item.vehicle.id || 'Fleet'}
          </p>
          <h3 className="mt-1 truncate text-xl font-black text-white">{item.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{item.revenueSource} - {Math.round(item.confidence)}% confidence</p>
        </div>
        <span className={`text-3xl font-black ${toneForScore(item.healthScore)}`}>{item.healthScore}</span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-slate-400">Fleet health</span>
          <span className="font-black text-slate-100">{item.healthScore}/100</span>
        </div>
        <ScoreBar value={item.healthScore} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Monthly Gross" value={formatCurrency(item.monthlyEstimate)} tone="text-sky-300" />
        <Metric label="Monthly Net" value={formatCurrency(item.netEstimate)} tone={item.netEstimate >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        <Metric label="Utilization" value={formatPercent(item.utilization)} />
        <Metric label="Daily Est." value={formatCurrency(item.dailyEstimate)} />
      </div>

      <button
        type="button"
        onClick={() => onQueueCommand?.(
          `AI earnings review for ${item.name}: ${formatCurrency(item.monthlyEstimate)} gross, ${formatCurrency(item.netEstimate)} net, ${Math.round(item.confidence)}% confidence.`,
          item.healthScore < 76 ? 'HIGH' : 'NORMAL',
        )}
        className="mt-4 w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
      >
        Queue AI Earnings Review
      </button>
    </article>
  );
}

function MaintenanceRow({ item, onQueueCommand }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${badgeTone(item.priority)}`}>
              {item.priority}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
              {item.window}
            </span>
          </div>
          <p className="font-black text-white">{item.name}</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">{item.task}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
        </div>
        <button
          type="button"
          onClick={() => onQueueCommand?.(
            `Schedule ${item.task} for ${item.name}: ${item.reason}`,
            item.priority,
          )}
          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
        >
          Schedule
        </button>
      </div>
    </div>
  );
}

function InsightCard({ alert }) {
  const tone = alert.severity === 'WARNING'
    ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
    : 'border-sky-400/20 bg-sky-400/10 text-sky-100';

  return (
    <article className={`rounded-lg border p-4 ${tone}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em]">{alert.severity}</p>
      <h3 className="mt-2 text-lg font-black text-white">{alert.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-200">{alert.detail}</p>
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

  const summary = useMemo(() => buildFleetHealthSummary(fleet, revenueRecords), [fleet, revenueRecords]);
  const maintenancePlan = useMemo(() => buildCleaningMaintenancePlan(fleet, revenueRecords), [fleet, revenueRecords]);
  const insights = useMemo(() => buildOperationalInsights(fleet, revenueRecords), [fleet, revenueRecords]);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Smart Gross" value={formatCurrency(summary.totalMonthly)} tone="text-sky-300" helper="Monthly estimate" />
        <Metric label="Smart Net" value={formatCurrency(summary.totalNet)} tone={summary.totalNet >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        <Metric label="Utilization" value={formatPercent(summary.avgUtilization)} tone="text-amber-300" />
        <Metric label="Fleet Health" value={`${Math.round(summary.avgHealth)}/100`} tone={toneForScore(summary.avgHealth)} />
        <Metric label="AI Confidence" value={formatPercent(summary.confidence)} tone="text-violet-300" />
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/15">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Core Robotaxi Operations
        </p>
        <h2 className="text-2xl font-black tracking-tight">Utilization, Earnings, Cleaning, and Health</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          Since rental revenue APIs are limited, FleetOS estimates earnings from utilization, telemetry, battery, health, and owner-entered revenue. The scheduler turns those signals into cleaning and maintenance work before vehicles lose availability.
        </p>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            AI Insights & Alerts
          </p>
          <div className="grid grid-cols-1 gap-3">
            {insights.alerts.map((alert) => (
              <InsightCard key={alert.title} alert={alert} />
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Cleaning & Maintenance Queue
          </p>
          <div className="space-y-3">
            {maintenancePlan.slice(0, 5).map((item) => (
              <MaintenanceRow
                key={item.vehicle.vin || item.vehicle.id}
                item={item}
                onQueueCommand={onQueueCommand}
              />
            ))}
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </section>
  );
}
