import {
  AlertCircle,
  ArrowRight,
  Bot,
  Car,
  CheckCircle2,
  ChevronRight,
  Gauge,
  RefreshCw,
  Wrench,
  Zap,
} from 'lucide-react';
import RoboWordmark from '../RoboWordmark';
import CommandMapPreview from './CommandMapPreview';
import FleetVehicleThumbnail from './FleetVehicleThumbnail';
import {
  getCommandAiPlan,
  getCommandStatusBoard,
  getFleetVisibilityRows,
} from '../../utils/commandHomeUtils';

const statusCellStyles = {
  ready: {
    rail: 'bg-emerald-400',
    value: 'text-white',
    sub: 'text-emerald-400/75',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/[0.06]',
    icon: 'text-emerald-300',
    iconWrap: 'bg-emerald-500/15',
  },
  caution: {
    rail: 'bg-amber-400',
    value: 'text-white',
    sub: 'text-amber-300/80',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/[0.06]',
    icon: 'text-amber-300',
    iconWrap: 'bg-amber-500/15',
  },
  connected: {
    rail: 'bg-[#599CE7]',
    value: 'text-white',
    sub: 'text-[#599CE7]/80',
    border: 'border-[#599CE7]/25',
    bg: 'bg-[#599CE7]/[0.06]',
    icon: 'text-[#87c3ff]',
    iconWrap: 'bg-[#599CE7]/15',
  },
  attention: {
    rail: 'bg-rose-400',
    value: 'text-white',
    sub: 'text-rose-300/80',
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/[0.06]',
    icon: 'text-rose-300',
    iconWrap: 'bg-rose-500/15',
  },
  neutral: {
    rail: 'bg-amber-400',
    value: 'text-white',
    sub: 'text-white/45',
    border: 'border-white/10',
    bg: 'bg-white/[0.03]',
    icon: 'text-amber-300',
    iconWrap: 'bg-amber-500/10',
  },
  idle: {
    rail: 'bg-white/25',
    value: 'text-white/80',
    sub: 'text-white/40',
    border: 'border-white/10',
    bg: 'bg-white/[0.03]',
    icon: 'text-white/50',
    iconWrap: 'bg-white/10',
  },
};

function StatusCell({ label, value, sub, tone, Icon, onClick }) {
  const styles = statusCellStyles[tone] || statusCellStyles.neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-3.5 text-left transition active:brightness-110 ${styles.border} ${styles.bg}`}
    >
      <span className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${styles.rail}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
          <p className={`mt-1.5 text-[1.65rem] font-semibold tabular-nums leading-none tracking-tight ${styles.value}`}>
            {value}
          </p>
          <p className={`mt-1.5 truncate text-[11px] font-medium ${styles.sub}`}>{sub}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}>
          <Icon className={`h-4 w-4 ${styles.icon}`} strokeWidth={2.1} />
        </span>
      </div>
    </button>
  );
}

function FleetStatusBoard({ board, onNavigate }) {
  return (
    <section aria-label="Fleet status">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Fleet Status</p>
      <div className="grid grid-cols-2 gap-2.5">
        <StatusCell
          label="Active Vehicles"
          value={board.active.value}
          sub={board.active.sub}
          tone={board.active.tone}
          Icon={Car}
          onClick={() => onNavigate('fleet')}
        />
        <StatusCell
          label="Utilization"
          value={board.utilization.value}
          sub={board.utilization.sub}
          tone={board.utilization.tone}
          Icon={Gauge}
          onClick={() => onNavigate('dispatch')}
        />
        <StatusCell
          label="Real Tesla"
          value={board.realTesla.value}
          sub={board.realTesla.sub}
          tone={board.realTesla.tone}
          Icon={Zap}
          onClick={() => onNavigate('account')}
        />
        <StatusCell
          label="Open Actions"
          value={board.openActions.value}
          sub={board.openActions.sub}
          tone={board.openActions.tone}
          Icon={AlertCircle}
          onClick={() => onNavigate('ai')}
        />
      </div>
    </section>
  );
}

function QuickActionTile({ label, detail, tone, Icon, onClick, disabled }) {
  const tones = {
    blue: 'border-[#599CE7]/25 bg-[#599CE7]/[0.08] text-[#87c3ff]',
    violet: 'border-violet-400/20 bg-violet-500/[0.08] text-violet-300',
    amber: 'border-amber-400/20 bg-amber-500/[0.08] text-amber-300',
    rose: 'border-rose-400/20 bg-rose-500/[0.08] text-rose-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[72px] flex-col justify-between rounded-xl border p-3 text-left transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" strokeWidth={2.1} />
      <span>
        <span className="block text-[12px] font-semibold text-white">{label}</span>
        <span className="mt-0.5 block text-[10px] text-white/45">{detail}</span>
      </span>
    </button>
  );
}

function AiPlanSection({ plan, syncState, isLoadingReal, onNavigate, onRetrySync, onQueueCommand }) {
  const pending = plan.pendingCount;

  return (
    <section
      className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#599CE7]/25 bg-white/[0.03]"
      aria-label="Today's AI Plan"
    >
      <div className="border-b border-white/[0.06] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#599CE7]/15 text-[#599CE7]">
            <Bot className="h-4 w-4" strokeWidth={2.1} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#599CE7]">Today&apos;s AI Plan</p>
            <p className="mt-1 text-[14px] font-medium leading-snug text-white/85">{plan.summary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
        <ul className="space-y-2.5">
          {plan.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/70">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#599CE7]" strokeWidth={2.2} />
              <span>{item}</span>
            </li>
          ))}
          {plan.checklist.length === 0 && (
            <li className="text-[13px] text-white/45">Connect Tesla to generate your first operating plan.</li>
          )}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          <QuickActionTile
            label={isLoadingReal ? 'Syncing…' : 'Sync Tesla'}
            detail="Refresh telemetry"
            tone="blue"
            Icon={RefreshCw}
            disabled={isLoadingReal}
            onClick={onRetrySync}
          />
          <QuickActionTile
            label="Rebalance Fleet"
            detail="Protect corridors"
            tone="violet"
            Icon={Car}
            onClick={() => onQueueCommand('Rebalance Orlando corridor fleet capacity', 'HIGH')}
          />
          <QuickActionTile
            label="Optimize Charging"
            detail="Off-peak windows"
            tone="amber"
            Icon={Zap}
            onClick={() => onNavigate('charging')}
          />
          <QuickActionTile
            label="Schedule Service"
            detail="Cleaning & maintenance"
            tone="rose"
            Icon={Wrench}
            onClick={() => onNavigate('health')}
          />
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3.5">
        <button
          type="button"
          onClick={() => onNavigate('ai')}
          disabled={syncState === 'loading'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#599CE7] px-4 py-3.5 text-[14px] font-semibold text-[#0a1020] transition active:brightness-110 disabled:opacity-60"
        >
          {pending > 0 ? `Approve ${pending} action${pending === 1 ? '' : 's'}` : 'Review AI plan'}
          <ArrowRight className="h-4 w-4" strokeWidth={2.3} />
        </button>
      </div>
    </section>
  );
}

function FleetVisibilitySection({ rows, onNavigate }) {
  if (!rows.length) return null;

  return (
    <section className="mt-4" aria-label="Fleet visibility">
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onNavigate('fleet')}
              className="flex w-full items-center gap-3 rounded-xl py-3 text-left transition active:bg-white/[0.04]"
            >
              <FleetVehicleThumbnail vehicle={row.vehicle} ownership={row.ownership} tone={row.tone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-white">
                  {row.name}
                  <span className="font-medium text-white/40"> · {row.kind}</span>
                </p>
                <p className="mt-0.5 truncate text-[12px] text-white/50">{row.line}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function FleetCommandHome({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  onRetrySync = () => {},
  onQueueCommand = () => {},
  onNavigate = () => {},
}) {
  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const board = getCommandStatusBoard(fleet, realFleet, syncState, commandQueue);
  const plan = getCommandAiPlan(fleet, realFleet, realSyncStatus, commandQueue);
  const visibilityRows = getFleetVisibilityRows(fleet, realFleet, 4);

  return (
    <div className="bg-[#0a0a0a] px-4 pb-8 pt-4">
      <header className="mb-5 flex items-center justify-between gap-3">
        <RoboWordmark className="text-[1.05rem]" />
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-300"
          aria-label="Account"
        >
          ●
        </button>
      </header>

      <FleetStatusBoard board={board} onNavigate={onNavigate} />

      <AiPlanSection
        plan={plan}
        syncState={syncState}
        isLoadingReal={isLoadingReal}
        onNavigate={onNavigate}
        onRetrySync={onRetrySync}
        onQueueCommand={onQueueCommand}
      />

      <div className="mt-5">
        <CommandMapPreview fleet={fleet} realFleet={realFleet} onNavigate={onNavigate} />
      </div>

      <FleetVisibilitySection rows={visibilityRows} onNavigate={onNavigate} />
    </div>
  );
}
