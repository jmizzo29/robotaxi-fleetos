import { ArrowRight, BatteryCharging, Bot, Car, MapPin, RefreshCw } from 'lucide-react';
import RoboWordmark from '../components/RoboWordmark';
import BetaBadge from '../components/BetaBadge';
import { Button, Card } from '../ui';

/**
 * Radically calm, premium, delightful Dashboard.
 * Ease of use is everything. One primary action: Review the plan.
 * Everything else supports that feeling of control and calm.
 */
export default function CommandDashboard({
  fleet = [],
  primaryTesla,
  commandQueue = [],
  onSync,
  onExecute,
  onNavigate,
  onSelectVehicle,
  isLoading = false,
  syncStatus,
}) {
  const activeCount = fleet.filter(v => v.status !== 'OFFLINE').length;
  const total = fleet.length || 0;
  const utilization = total
    ? Math.round(fleet.reduce((sum, v) => sum + (v.utilization || 0), 0) / total)
    : 0;

  const hasPlan = fleet.length > 0;
  const pendingCount = commandQueue.length || 2;

  // One beautiful, calm sentence that tells the owner exactly what matters
  const statusLine = hasPlan
    ? `${activeCount} of ${total} vehicles ready • ${utilization}% utilization`
    : 'Connect your first Tesla to get started';

  return (
    <div className="mx-auto max-w-[720px] px-10 pt-8 pb-16">
      {/* Ultra calm header with generous space */}
      <div className="mb-12">
        <div className="text-[10px] tracking-[3.5px] text-ink-muted/50 font-mono mb-3">ROBOAGENT</div>
        <div className="text-[72px] leading-[0.88] font-semibold tracking-[-4px] text-ink">Good morning.</div>
      </div>

      {/* One beautiful status line */}
      <div className="mb-16 text-[15px] text-ink-muted flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        {statusLine}
      </div>

      {/* The pure, delightful heart: a spacious, premium plan hero. Everything else fades away. */}
      <div className="rounded-3xl border border-ink/8 bg-white p-10 shadow-[0_20px_60px_-20px_rgb(0,0,0,0.06)]">
        <div className="uppercase text-xs tracking-[3px] text-emerald-600 font-medium mb-4">TODAY’S AI PLAN</div>

        <div className="text-[48px] leading-[1.0] font-semibold tracking-[-2.2px] text-ink mb-8">
          {hasPlan
            ? `Review ${pendingCount} actions to protect earnings.`
            : 'Connect your Tesla to begin.'}
        </div>

        {hasPlan && (
          <div className="mb-10 space-y-5 text-[17px] leading-relaxed text-ink">
            <div className="flex gap-4">
              <div className="font-mono text-xs tracking-[2px] text-emerald-600/70 mt-1.5">01</div>
              <div>Raise weekend pricing on the Model Y</div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono text-xs tracking-[2px] text-emerald-600/70 mt-1.5">02</div>
              <div>Charge during the lowest-cost overnight window</div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono text-xs tracking-[2px] text-emerald-600/70 mt-1.5">03</div>
              <div>Clean Vehicle 2 before the morning handoff</div>
            </div>
          </div>
        )}

        <Button 
          size="lg" 
          onClick={() => onNavigate('ai')}
          className="w-full text-[16px] py-7 rounded-2xl tracking-[-0.3px]"
        >
          Review &amp; approve plan
        </Button>
      </div>

      {/* Primary vehicle: calm, scannable, delightful to glance at */}
      {primaryTesla && (
        <div className="mt-8">
          <div className="uppercase text-[10px] tracking-[2px] text-ink-muted mb-3 px-2">Primary vehicle</div>
          <button 
            onClick={() => { onSelectVehicle?.(primaryTesla); onNavigate('vehicle'); }}
            className="flex w-full items-center justify-between rounded-3xl border border-ink/10 bg-white p-7 text-left hover:border-ink/15 active:bg-surface-raised/50 transition group"
          >
            <div>
              <div className="text-xl font-semibold tracking-tight text-ink group-hover:text-emerald-700 transition">{primaryTesla.name || primaryTesla.id}</div>
              <div className="text-sm text-ink-muted mt-1">{primaryTesla.city || primaryTesla.status}</div>
            </div>
            <div className="text-right">
              <div className="text-[48px] font-semibold tabular-nums tracking-[-2px] text-emerald-600 leading-none">{Math.round(primaryTesla.battery || 0)}</div>
              <div className="text-xs text-ink-subtle tracking-wider">BATTERY</div>
            </div>
          </button>
        </div>
      )}

      {total === 0 && (
        <div className="mt-8 text-center">
          <Button onClick={() => onNavigate('onboarding')} size="lg" className="px-14">Connect your first Tesla</Button>
        </div>
      )}
    </div>
  );
}
