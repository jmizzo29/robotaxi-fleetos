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
    <div className="mx-auto max-w-[580px] px-4 pt-14 pb-20">
      {/* Extremely restrained header */}
      <div className="mb-5">
        <div className="text-[8px] tracking-[4px] text-ink-muted/60 font-mono">ROBOAGENT</div>
        <div className="text-[64px] leading-[0.88] font-semibold tracking-[-3.2px] text-ink mt-1">Good morning.</div>
      </div>

      {/* The absolute minimum status */}
      <div className="mb-16 text-[13px] text-ink-muted flex items-center gap-2">
        <span className={`h-1 w-1 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        {statusLine}
      </div>

      {/* PURE FOCUS — this is the entire calm, premium, delightful experience */}
      <div>
        <div className="text-[10px] tracking-[2.5px] text-emerald-600 font-medium mb-2">TODAY’S AI PLAN</div>

        <div className="text-[52px] leading-[0.92] font-semibold tracking-[-2.4px] text-ink mb-6">
          {hasPlan
            ? `Review ${pendingCount} actions.<br />Protect earnings.`
            : 'Connect your Tesla<br />to begin.'}
        </div>

        {hasPlan && (
          <div className="text-[19px] leading-tight text-ink mb-10 space-y-1 pl-px">
            <div>Raise Model Y weekend pricing</div>
            <div>Charge in the cheapest overnight window</div>
            <div>Clean Vehicle 2 before morning</div>
          </div>
        )}

        <Button
          size="lg"
          onClick={() => onNavigate('ai')}
          className="w-full text-lg py-6 rounded-3xl tracking-[-0.3px]"
        >
          Review &amp; approve plan
        </Button>
      </div>
    </div>
  );
}
