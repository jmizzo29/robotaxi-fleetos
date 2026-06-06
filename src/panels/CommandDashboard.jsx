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
    <div className="mx-auto max-w-[640px] px-6 pt-12 pb-16">
      {/* Minimal, calm header with huge greeting */}
      <div className="mb-8">
        <div className="text-[9px] tracking-[3px] text-ink-muted/70 font-mono mb-1">ROBOAGENT</div>
        <div className="text-[58px] leading-none font-semibold tracking-[-2.8px] text-ink">Good morning.</div>
      </div>

      {/* Single elegant status line */}
      <div className="mb-12 text-[14px] text-ink-muted flex items-center gap-2.5">
        <span className={`h-[6px] w-[6px] rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        {statusLine}
      </div>

      {/* The calm, premium, delightful core: one focused hero plan. Nothing else competes. */}
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="uppercase text-xs tracking-[2px] text-emerald-600 font-medium mb-3">TODAY’S AI PLAN</div>

        <div className="text-[40px] leading-[1.05] font-semibold tracking-[-1.6px] text-ink mb-6">
          {hasPlan
            ? `Review ${pendingCount} actions to protect earnings.`
            : 'Connect your Tesla to begin.'}
        </div>

        {hasPlan && (
          <div className="space-y-3 mb-8 text-[15px] text-ink">
            <div className="flex gap-3">
              <span className="text-emerald-600 font-medium">1</span>
              <span>Raise weekend pricing on the Model Y</span>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-600 font-medium">2</span>
              <span>Charge during the lowest-cost overnight window</span>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-600 font-medium">3</span>
              <span>Clean Vehicle 2 before the morning handoff</span>
            </div>
          </div>
        )}

        <Button 
          size="lg" 
          onClick={() => onNavigate('ai')}
          className="w-full text-base py-5 rounded-2xl"
        >
          Review &amp; approve plan
        </Button>
      </div>

      {/* Only the primary vehicle as a clean row — extreme reduction */}
      {primaryTesla && (
        <div className="mt-8 flex items-center justify-between text-sm border-t border-ink/10 pt-4">
          <div>
            <span className="font-medium text-ink">{primaryTesla.name || primaryTesla.id}</span>
            <span className="text-ink-muted ml-2">· {primaryTesla.city || primaryTesla.status}</span>
          </div>
          <button 
            onClick={() => { onSelectVehicle?.(primaryTesla); onNavigate('vehicle'); }}
            className="font-semibold text-emerald-600 hover:underline"
          >
            {Math.round(primaryTesla.battery || 0)}% battery →
          </button>
        </div>
      )}

      {total === 0 && (
        <div className="mt-8 text-center">
          <Button onClick={() => onNavigate('onboarding')} size="lg" className="w-full">Connect your first Tesla</Button>
        </div>
      )}
    </div>
  );
}
