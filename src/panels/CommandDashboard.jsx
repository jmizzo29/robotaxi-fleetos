import { ArrowRight, Battery, Bot, Car, Map, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import RoboWordmark from '../components/RoboWordmark';
import BetaBadge from '../components/BetaBadge';
import { Button, Card, Chip, Metric, StatusDot } from '../ui';

function formatTime(value) {
  if (!value) return 'Not synced';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function syncTone(state) {
  if (state === 'ok' || state === 'success') return 'ready';
  if (!state) return 'offline';
  return 'caution';
}

function VehicleChip({ vehicle, onSelect }) {
  const name = vehicle.name || vehicle.display_name || vehicle.id;
  const battery = vehicle.battery ? `${Math.round(vehicle.battery)}%` : '—';
  const isReady = ['IN SERVICE', 'PICKUP', 'EN ROUTE', 'REPOSITIONING', 'online'].includes(vehicle.status);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(vehicle)}
      className="flex min-w-[148px] shrink-0 flex-col rounded-2xl border border-ink/10 bg-surface-raised p-3 text-left transition hover:border-ink/15 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <StatusDot tone={isReady ? 'ready' : 'caution'} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">{vehicle.city || vehicle.status || '—'}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{battery}</p>
    </button>
  );
}

export default function CommandDashboard({
  fleet = [],
  primaryTesla,
  totalRevenue = 0,
  avgAnomalyRisk = 0,
  commandQueue = [],
  onSync,
  onExecute,
  onNavigate,
  onSelectVehicle,
  isLoading = false,
  syncStatus,
}) {
  const active = fleet.filter((vehicle) => vehicle.status !== 'OFFLINE').length;
  const utilization = fleet.length
    ? Math.round(fleet.reduce((sum, vehicle) => sum + (vehicle.utilization || 0), 0) / fleet.length)
    : 0;
  const riskLabel = avgAnomalyRisk > 15 ? 'High' : avgAnomalyRisk > 8 ? 'Medium' : 'Low';
  const riskTone = avgAnomalyRisk > 15 ? 'critical' : avgAnomalyRisk > 8 ? 'warning' : 'success';
  const pendingActions = commandQueue.length || 3;

  const planSummary = fleet.length
    ? `${active} vehicles ready. Review ${pendingActions} AI recommendations, optimize overnight charging, and protect morning demand.`
    : 'Connect your first Tesla to unlock your daily fleet plan.';

  return (
    <section className="animate-fade-up space-y-5 lg:space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            <RoboWordmark />
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Home</h1>
            <BetaBadge />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
            <StatusDot tone={syncTone(syncStatus?.state)} pulse={isLoading} />
            <span>
              {fleet.length ? `${active} of ${fleet.length} ready` : 'No vehicles connected'}
              {syncStatus?.lastSyncedAt ? ` · Synced ${formatTime(syncStatus.lastSyncedAt)}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSync}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing' : 'Sync'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('account')}>
            Account
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Ready" value={`${active}/${fleet.length || 0}`} tone="success" icon={Car} />
        <Metric label="Utilization" value={`${utilization}%`} tone="warning" icon={TrendingUp} />
        <Metric label="Risk" value={riskLabel} tone={riskTone} icon={Battery} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-status-ready/10 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-status-ready" />
                <p className="text-sm font-semibold text-ink">Today&apos;s plan</p>
              </div>
              <Chip active className="pointer-events-none">Live</Chip>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{planSummary}</p>
            {primaryTesla && (
              <p className="mt-3 text-xs text-ink-subtle">
                Primary vehicle · {Math.round(primaryTesla.battery || 0)}% · {primaryTesla.status || '—'}
              </p>
            )}
            <Button className="mt-4 w-full sm:w-auto" onClick={() => onNavigate('ai')}>
              Review & approve
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Quick actions</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={onSync}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Tesla
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigate('map')}>
              <Map className="h-4 w-4" />
              Open map
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigate('ai')}>
              <Bot className="h-4 w-4" />
              Ask agent
            </Button>
          </div>
          <button
            type="button"
            onClick={() => onExecute?.('Build optimal charging plan for tonight across the fleet', 'HIGH')}
            className="mt-3 w-full text-left text-xs font-medium text-status-active transition hover:text-ink"
          >
            Schedule overnight charging →
          </button>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <p className="text-sm font-semibold text-ink">Your fleet</p>
          <button
            type="button"
            onClick={() => onNavigate('fleet')}
            className="text-xs font-medium text-status-active transition hover:text-ink"
          >
            View all
          </button>
        </div>

        {fleet.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-ink-muted">No vehicles connected yet.</p>
            <Button className="mt-3" onClick={() => onNavigate('onboarding')}>
              Connect Tesla
            </Button>
          </Card>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {fleet.slice(0, 6).map((vehicle) => (
              <VehicleChip
                key={vehicle.id}
                vehicle={vehicle}
                onSelect={(item) => {
                  onSelectVehicle?.(item);
                  onNavigate('vehicle');
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Card className="hidden sm:block">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Earnings snapshot</p>
            <p className="mt-1 text-2xl font-semibold text-status-ready">
              ${totalRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Fleet revenue · tap Money for full breakdown</p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('finance')}>
            Open Money
          </Button>
        </div>
      </Card>
    </section>
  );
}
