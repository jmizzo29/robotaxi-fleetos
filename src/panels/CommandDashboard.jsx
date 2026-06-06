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
    <div className="mx-auto max-w-[680px] px-5 pt-10 pb-24">
      {/* Dead simple, almost nothing header */}
      <div className="mb-6">
        <div className="text-[10px] tracking-[4px] text-ink-muted font-mono mb-1">ROBOAGENT</div>
        <div className="text-[56px] leading-[0.95] font-semibold tracking-[-2.5px] text-ink">Good morning.</div>
      </div>

      {/* One single status line */}
      <div className="mb-14 text-[15px] text-ink-muted flex items-center gap-2">
        <span className={`h-[5px] w-[5px] rounded-full inline-block ${isLoading ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        {statusLine}
      </div>

      {/* THE ENTIRE INTERFACE — one calm, huge, focused block. This is it. */}
      <div>
        <div className="uppercase tracking-[2.5px] text-xs text-emerald-600 font-medium mb-2">TODAY’S AI PLAN</div>

        <div className="text-[44px] leading-none font-semibold tracking-[-1.8px] text-ink mb-7">
          {hasPlan
            ? `Review ${pendingCount} actions.<br />Protect earnings.`
            : 'Connect Tesla<br />to begin.'}
        </div>

        {hasPlan && (
          <div className="text-[17px] leading-tight text-ink mb-8 pl-0.5 space-y-[3px]">
            <div>Raise Model Y weekend pricing</div>
            <div>Charge in the cheapest overnight window</div>
            <div>Clean Vehicle 2 before morning</div>
          </div>
        )}

        <Button 
          size="lg" 
          onClick={() => onNavigate('ai')}
          className="w-full text-[17px] py-5 rounded-3xl tracking-[-0.2px]"
        >
          Review &amp; approve plan
        </Button>

        <div className="text-center mt-4">
          <button 
            onClick={() => onNavigate('ai')} 
            className="text-sm text-ink-muted hover:text-ink"
          >
            Ask the Agent instead
          </button>
        </div>
      </div>
    </div>
  );
}
