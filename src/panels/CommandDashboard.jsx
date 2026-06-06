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
    <div className="mx-auto max-w-[820px] px-6 pt-6 pb-16">
      {/* Ultra minimal header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[13px] tracking-[2px] text-ink-muted font-mono">ROBOAGENT</div>
          <div className="text-4xl font-semibold tracking-[-1px] text-ink mt-1">Good morning.</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          SYNC
        </Button>
      </div>

      {/* One-line calm status — everything else stripped */}
      <div className="mb-10 text-base text-ink-muted flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${isLoading ? 'bg-status-caution' : 'bg-status-ready'}`} />
        {statusLine}
      </div>

      {/* MASSIVE HERO — the only thing that matters. Extreme focus. */}
      <div className="mb-12">
        <div className="text-xs tracking-[2px] text-status-ready font-medium mb-3 flex items-center gap-2">
          <Bot className="h-3.5 w-3.5" /> TODAY’S PLAN
        </div>

        <div className="text-[42px] leading-[1.05] font-semibold tracking-[-1.2px] text-ink mb-8 pr-4">
          {hasPlan
            ? `Review ${pendingCount} actions.<br />Protect earnings.`
            : 'Connect your Tesla<br />to begin.'}
        </div>

        {hasPlan && (
          <div className="space-y-4 mb-8 text-xl text-ink pl-1">
            <div>1. Raise Model Y weekend rate 18%</div>
            <div>2. Charge overnight in cheapest window</div>
            <div>3. Clean Vehicle 2 before morning</div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button size="lg" onClick={() => onNavigate('ai')} className="px-10 text-base">
            Review plan
          </Button>
          <button onClick={() => onNavigate('ai')} className="text-sm text-ink-muted hover:text-ink underline-offset-4 hover:underline">
            or ask the Agent
          </button>
        </div>
      </div>

      {/* One primary vehicle only — extreme reduction */}
      {primaryTesla && (
        <div>
          <div className="text-xs tracking-[2px] text-ink-muted font-medium mb-3">PRIMARY</div>
          <button
            onClick={() => {
              onSelectVehicle?.(primaryTesla);
              onNavigate('vehicle');
            }}
            className="w-full text-left p-6 rounded-3xl border border-ink/10 bg-surface-raised hover:border-ink/20 active:bg-white transition flex justify-between items-center"
          >
            <div>
              <div className="text-2xl font-semibold tracking-tight">{primaryTesla.name || primaryTesla.id}</div>
              <div className="text-sm text-ink-muted mt-0.5">{primaryTesla.city || primaryTesla.status}</div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-semibold tabular-nums tracking-[-1px] text-status-ready">
                {Math.round(primaryTesla.battery || 0)}
                <span className="text-2xl align-super">%</span>
              </div>
              <div className="text-xs text-ink-subtle -mt-1">battery</div>
            </div>
          </button>
        </div>
      )}

      {total === 0 && (
        <div className="mt-12 text-center">
          <Button onClick={() => onNavigate('onboarding')} size="lg">Connect first Tesla</Button>
        </div>
      )}
    </div>
  );
}
