import RoboWordmark from '../components/RoboWordmark';
import BetaBadge from '../components/BetaBadge';
import { TrendingUp, BatteryCharging, MapPin, DollarSign, RefreshCw, ArrowRight } from 'lucide-react';

function MiniMetric({ label, value, tone, Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 shadow-lg shadow-black/20">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold leading-tight text-slate-300">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function formatTime(value) {
  if (!value) return 'Not synced';

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ActionTile({ label, detail, tone, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[58px] rounded-2xl border px-3 py-3 text-left shadow-lg shadow-black/15 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 ${tone}`}
    >
      <span className="block text-sm font-black text-white">{label}</span>
      <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-300">{detail}</span>
    </button>
  );
}

export default function MobileCommandDashboard({
  fleet = [],
  primaryTesla,
  totalRevenue,
  avgAnomalyRisk,
  onSync,
  onExecute,
  onNavigate,
  isLoading,
  syncStatus,
}) {
  const active = fleet.filter((vehicle) => vehicle.status !== 'OFFLINE').length;
  const utilization = fleet.length
    ? Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.utilization || 0), 0) / fleet.length)
    : 0;
  const alerts = avgAnomalyRisk > 15 ? 'High' : avgAnomalyRisk > 8 ? 'Med' : 'Low';

  // Simple dynamic-ish plan summary based on live fleet data
  const planSummary = fleet.length > 0 
    ? `Raise pricing on ${active} ready vehicles, optimize overnight charging, prep for morning demand.`
    : 'Connect your first Tesla to get a personalized daily plan.';

  const planActions = [
    'Review 3 high-confidence actions',
    utilization > 70 ? 'Protect high utilization streak' : 'Boost utilization 12%',
    'Charge during cheapest 6-hour window',
  ];

  return (
    <section className="space-y-5 lg:hidden">
      {/* Header + persistent Tesla status (audit mobile: instant visibility on home) */}
      <div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm">
              <RoboWordmark colorClass="text-sky-300" />
            </p>
            <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Command</h1>
            <BetaBadge />
          </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-sky-300 active:bg-white/10"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isLoading ? '...' : 'Sync'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('account')}
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-slate-200"
            >
              Account
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className={`inline-block h-2 w-2 rounded-full ${syncStatus?.state === 'ok' || syncStatus?.state === 'success' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            Tesla {syncStatus?.state || 'Not synced'}
          </div>
          {primaryTesla && (
            <div className="font-black text-white">
              {primaryTesla.battery ? `${Math.round(primaryTesla.battery)}%` : '—'} • {primaryTesla.status || '—'}
            </div>
          )}
        </div>
      </div>

      {/* Clean 3 KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MiniMetric
          label="Active"
          value={`${active}/${fleet.length || 0}`}
          tone="bg-emerald-400 text-slate-950"
          Icon={TrendingUp}
        />
        <MiniMetric
          label="Utilization"
          value={`${utilization}%`}
          tone="bg-amber-300 text-slate-950"
          Icon={BatteryCharging}
        />
        <MiniMetric
          label="Risk"
          value={alerts}
          tone="bg-rose-400 text-slate-950"
          Icon={ArrowRight}
        />
      </div>

      {/* Today's AI Plan — elevated, actionable */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-white">Today’s AI Plan</p>
            <p className="text-[11px] text-emerald-300">3 actions • Updated just now</p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">LIVE</span>
        </div>
        <p className="text-sm leading-snug text-slate-200">{planSummary}</p>
        
        <div className="mt-3 space-y-1 text-xs text-slate-300">
          {planActions.map((a, i) => (
            <div key={i} className="flex items-center gap-2">→ {a}</div>
          ))}
        </div>

        <button
          onClick={() => onNavigate('ai')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-[#172231] active:opacity-90"
        >
          Review & Approve <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions 2x2 — wired to real commands */}
      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          label={isLoading ? 'Syncing…' : 'Sync Tesla'}
          detail="Pull latest telemetry"
          tone="border-emerald-400/20 bg-emerald-400/10"
          onClick={onSync}
          disabled={isLoading}
        />
        <ActionTile
          label="Ask Agent"
          detail="Get fresh recommendations"
          tone="border-sky-400/20 bg-sky-400/10"
          onClick={() => onNavigate('ai')}
        />
        <ActionTile
          label="Charge Plan"
          detail="Smart overnight window"
          tone="border-violet-400/20 bg-violet-400/10"
          onClick={() => onExecute?.('Build optimal charging plan for tonight across the fleet', 'HIGH')}
        />
        <ActionTile
          label="Money"
          detail="Revenue & costs today"
          tone="border-white/10 bg-white/5"
          onClick={() => onNavigate('finance')}
        />
      </div>

      {/* Sync status */}
      {syncStatus && (
        <div className="text-center text-[11px] text-slate-400">
          Last synced {formatTime(syncStatus.lastSyncedAt)} • {syncStatus.state}
        </div>
      )}

      {/* Vehicles at a Glance — compact + tappable */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Your Fleet</p>
          <button onClick={() => onNavigate('fleet')} className="text-[11px] font-bold text-sky-300">All vehicles →</button>
        </div>
        <div className="space-y-2">
          {fleet.slice(0, 3).map((v) => {
            const statusColor = v.status === 'IN SERVICE' || v.status === 'PICKUP' ? 'text-emerald-400' : 'text-amber-300';
            return (
              <button
                key={v.id}
                onClick={() => onNavigate('fleet')}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left active:bg-white/10"
              >
                <div>
                  <p className="font-black text-white">{v.id}</p>
                  <p className="text-[11px] text-slate-400">{v.city || '—'}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-black text-white">{v.battery ? `${Math.round(v.battery)}%` : '—'}</p>
                  <p className={`text-[10px] font-semibold ${statusColor}`}>{v.status}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Readiness footer */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>Fleet Ready</span>
          <span className="font-black text-white">{Math.round((active / (fleet.length || 1)) * 100)}%</span>
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">{active} vehicles ready for dispatch right now</div>
      </div>

      {fleet.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
          <p className="text-sm text-slate-300">No vehicles connected yet.</p>
          <button onClick={() => onNavigate('onboarding')} className="mt-3 text-sm font-black text-sky-300">Connect your first Tesla →</button>
        </div>
      )}
    </section>
  );
}
