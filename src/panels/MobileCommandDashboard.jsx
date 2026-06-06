import RoboWordmark from '../components/RoboWordmark';
import BetaBadge from '../components/BetaBadge';
import { Bot, RefreshCw, ArrowRight } from 'lucide-react';

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
  onSync,
  onNavigate,
  isLoading,
  syncStatus,
}) {
  const active = fleet.filter((vehicle) => vehicle.status !== 'OFFLINE').length;
  const total = fleet.length || 0;
  const utilization = total
    ? Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.utilization || 0), 0) / total)
    : 0;

  const hasPlan = total > 0;
  const pendingCount = 3; // calm fixed number for focus

  const statusLine = hasPlan
    ? `${active} of ${total} ready • ${utilization}% utilization`
    : 'Connect your first Tesla to get started';

  return (
    <section className="px-4 pt-8 pb-16 space-y-8 lg:hidden">
      {/* Dead simple mobile header */}
      <div>
        <div className="text-[8px] tracking-[3px] text-white/60 font-mono">ROBOAGENT</div>
        <div className="text-[42px] leading-[0.9] font-semibold tracking-[-1.8px] text-white mt-1">Good morning.</div>
      </div>

      {/* One calm status */}
      <div className="text-sm text-white/70 flex items-center gap-2">
        <span className={`h-1 w-1 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        {statusLine}
      </div>

      {/* The only thing — huge calm plan hero for mobile */}
      <div>
        <div className="text-[9px] tracking-[2px] text-emerald-400 font-medium mb-1.5">TODAY’S AI PLAN</div>
        <div className="text-[32px] leading-tight font-semibold tracking-[-1.2px] text-white mb-5">
          {hasPlan
            ? `Review ${pendingCount} actions.<br />Protect earnings.`
            : 'Connect Tesla<br />to begin.'}
        </div>

        {hasPlan && (
          <div className="text-base leading-snug text-white/90 mb-6 space-y-0.5">
            <div>Raise Model Y weekend pricing</div>
            <div>Charge in the cheapest overnight window</div>
            <div>Clean Vehicle 2 before morning</div>
          </div>
        )}

        <button
          onClick={() => onNavigate('ai')}
          className="w-full rounded-2xl bg-white py-4 text-base font-semibold text-[#172231] active:bg-white/90"
        >
          Review &amp; approve plan
        </button>
      </div>

      {/* One primary car, nothing else */}
      {primaryTesla && (
        <button onClick={() => onNavigate('vehicle')} className="w-full text-left">
          <div className="text-[8px] tracking-[1.5px] text-white/50 mb-1">YOUR CAR</div>
          <div className="flex justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
            <div>
              <div className="font-semibold text-white">{primaryTesla.name || primaryTesla.id}</div>
              <div className="text-xs text-white/60">{primaryTesla.city || primaryTesla.status}</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-semibold tabular-nums tracking-tighter text-emerald-400">
                {Math.round(primaryTesla.battery || 0)}%
              </div>
            </div>
          </div>
        </button>
      )}

      {total === 0 && (
        <button onClick={() => onNavigate('onboarding')} className="w-full rounded-2xl bg-white py-4 text-base font-semibold text-[#172231]">
          Connect first Tesla
        </button>
      )}
    </section>
  );
}
