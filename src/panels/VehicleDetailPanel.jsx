import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Battery,
  Bell,
  Clock,
  Cpu,
  Gauge,
  Lock,
  LockOpen,
  MapPin,
  Navigation,
  Power,
  RefreshCw,
  Snowflake,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { Button, Card, Chip, Metric, StatusDot } from '../ui';
import { getVehicleOwnership } from '../data/vehicleOwnership';
import { maskVin } from '../utils/vinPrivacy';
import { getLocationHistory, summarizeLocationHistory } from '../services/locationHistory';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'telemetry', label: 'Telemetry' },
  { id: 'controls', label: 'Controls' },
  { id: 'history', label: 'History' },
];

function formatNumber(value, suffix = '') {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  return `${Math.round(Number(value)).toLocaleString()}${suffix}`;
}

function formatTime(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDistance(miles) {
  if (!Number.isFinite(Number(miles))) return 'Unavailable';
  if (Number(miles) < 0.1) return `${Math.round(Number(miles) * 5280)} ft`;
  return `${Number(miles).toFixed(2)} mi`;
}

// Map raw Tesla state into the calm status vocabulary used across the product.
function deriveStatus(vehicle) {
  const raw = `${vehicle?.status || vehicle?.state || ''}`.toLowerCase();
  const charging = /charg/i.test(vehicle?.chargingState || '');
  const speed = Number(vehicle?.speed) || 0;
  const risk = Number(vehicle?.anomalyRisk) || 0;

  if (['offline', 'asleep', 'suspended'].includes(raw)) {
    return { label: 'Offline', tone: 'offline' };
  }
  if (charging) return { label: 'Charging', tone: 'active' };
  if (speed > 1) return { label: 'In use', tone: 'active' };
  if (risk > 20) return { label: 'Attention', tone: 'caution' };
  return { label: 'Ready', tone: 'ready' };
}

function batteryTone(battery) {
  if (battery < 20) return 'critical';
  if (battery < 40) return 'warning';
  return 'success';
}

// Turn the raw telemetry into a single "what changed / what to do" recommendation.
function buildInsight(vehicle, name) {
  const battery = Number.isFinite(vehicle?.battery) ? Math.round(vehicle.battery) : null;
  const risk = Number(vehicle?.anomalyRisk) || 0;
  const locked = vehicle?.locked;

  if (battery !== null && battery < 25) {
    return {
      summary: `${name} is at ${battery}% and below the dispatch floor. Range is tight for the next ride window.`,
      action: 'Send to charge now',
      command: `Route ${name} to the nearest charger and start a charging session`,
      priority: 'HIGH',
    };
  }
  if (risk > 20) {
    return {
      summary: `Anomaly risk for ${name} is elevated at ${Math.round(risk)}%. A telemetry pattern looks off versus the fleet baseline.`,
      action: 'Queue service review',
      command: `Schedule a diagnostic service review for ${name}`,
      priority: 'HIGH',
    };
  }
  if (locked === false) {
    return {
      summary: `${name} is currently unlocked while idle. Securing it protects the asset between rides.`,
      action: 'Lock vehicle',
      command: `Lock the doors on ${name}`,
      priority: 'NORMAL',
    };
  }
  return {
    summary: `${name} looks healthy${battery !== null ? ` at ${battery}% charge` : ''}. No action needed right now — keep it in the ready pool.`,
    action: 'Run AI review',
    command: `AI review requested for ${name}`,
    priority: 'AI',
  };
}

function TabBar({ active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Vehicle detail sections"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-surface-raised p-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DetailTile({ label, value, icon: Icon, tone = 'text-ink' }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink/8 bg-surface-raised p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium text-ink-muted sm:text-xs">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <p className={`mt-1.5 truncate text-base font-semibold tracking-tight sm:text-lg ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function ControlButton({ icon: Icon, label, hint, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface-raised p-4 text-left transition hover:border-ink/15 hover:shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="block truncate text-xs text-ink-muted">{hint}</span>}
      </span>
    </button>
  );
}

function HistoryTab({ vehicle }) {
  const [records, setRecords] = useState(() => getLocationHistory(vehicle));

  useEffect(() => {
    const refresh = () => setRecords(getLocationHistory(vehicle));
    refresh();
    window.addEventListener('fleetos-location-history-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('fleetos-location-history-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [vehicle]);

  const summary = useMemo(() => summarizeLocationHistory(records), [records]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Last seen" value={formatTime(summary.latest?.timestamp)} icon={Clock} />
        <Metric label="Last moved" value={formatTime(summary.lastMoved?.timestamp)} icon={Navigation} />
        <Metric label="Tracked" value={formatDistance(summary.totalMiles)} tone="success" icon={MapPin} />
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-ink">Trip &amp; parking timeline</p>
          <Chip className="pointer-events-none">{summary.snapshotCount} syncs</Chip>
        </div>
        {records.length > 0 ? (
          <ul className="divide-y divide-ink/8">
            {records.slice(0, 8).map((record) => (
              <li key={record.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{formatDateTime(record.timestamp)}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-status-ready">{Math.round(record.battery || 0)}%</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{record.movedFeet || 0} ft</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            Sync Tesla telemetry to start building location history.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function VehicleDetailPanel({
  vehicle,
  onSync,
  isLoading,
  onShowMap,
  onQueueCommand,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!vehicle) {
    return (
      <Card className="animate-fade-up flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
          <Activity className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-semibold text-ink">No vehicle selected</p>
          <p className="mt-1 text-sm text-ink-muted">
            Choose a vehicle from your fleet to inspect telemetry, controls, and AI actions.
          </p>
        </div>
      </Card>
    );
  }

  const name = vehicle.name || vehicle.display_name || vehicle.id;
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
  const battery = Number.isFinite(vehicle.battery) ? Math.round(vehicle.battery) : 0;
  const status = deriveStatus(vehicle);
  const modelLine = [ownership.modelYear, ownership.model || (vehicle.isReal ? 'Tesla Vehicle' : 'Demo Vehicle')]
    .filter(Boolean)
    .join(' · ');
  const insight = buildInsight(vehicle, name);

  const queueControl = (command, priority = 'NORMAL') => onQueueCommand?.(command, priority);

  return (
    <section className="animate-fade-up space-y-5">
      <Card className="relative overflow-hidden" padding="p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-status-ready/10 blur-3xl" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                <Chip className="pointer-events-none">{vehicle.isReal ? 'Live Tesla' : 'Demo Vehicle'}</Chip>
                {vehicle.vin && <span className="truncate">{maskVin(vehicle.vin)}</span>}
              </div>
              <h2 className="mt-3 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{name}</h2>
              <p className="mt-1 text-sm text-ink-muted">{modelLine || vehicle.assignment || 'ROBOAGENT vehicle record'}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-ink">
                <StatusDot tone={status.tone} pulse={status.tone === 'active'} />
                <span className="font-medium">{status.label}</span>
                {vehicle.chargingState && (
                  <span className="text-ink-muted">· {vehicle.chargingState}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onSync} disabled={isLoading} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncing' : 'Sync'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onShowMap} className="gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Map
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Battery" value={`${battery}%`} tone={batteryTone(battery)} icon={Battery} />
            <Metric label="Odometer" value={vehicle.odometer ? formatNumber(vehicle.odometer, ' mi') : '—'} icon={Gauge} />
            <Metric label="Speed" value={formatNumber(vehicle.speed || 0, ' mph')} tone="info" icon={Navigation} />
            <Metric label="Health" value={`${Math.round(vehicle.maintenanceScore || 90)}%`} tone="success" icon={Wrench} />
          </div>
        </div>
      </Card>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="animate-fade-up space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailTile label="Charging" value={vehicle.chargingState || 'Idle'} icon={Zap} />
            <DetailTile
              label="Locked"
              value={vehicle.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'}
              tone={vehicle.locked === false ? 'text-status-caution' : 'text-ink'}
              icon={vehicle.locked === false ? LockOpen : Lock}
            />
            <DetailTile
              label="Anomaly risk"
              value={`${Math.round(vehicle.anomalyRisk || 0)}%`}
              tone={(vehicle.anomalyRisk || 0) > 20 ? 'text-status-critical' : 'text-ink'}
              icon={Activity}
            />
            <DetailTile label="Utilization" value={`${Math.round(vehicle.utilization || 0)}%`} icon={Gauge} />
          </div>

          <Card className="border-l-4 border-l-status-active">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-status-ready/10 text-status-ready">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">AI insight</p>
                  <p className="text-xs text-ink-muted">What changed · what to do</p>
                </div>
              </div>
              <Chip active className="pointer-events-none">{insight.priority}</Chip>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{insight.summary}</p>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => queueControl(insight.command, insight.priority)}
            >
              {insight.action}
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="animate-fade-up space-y-4">
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-ink">Live telemetry</p>
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" />
                Synced {formatTime(vehicle.syncedAt)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <DetailTile label="Battery" value={`${battery}%`} tone={battery < 30 ? 'text-status-caution' : 'text-status-ready'} icon={Battery} />
              <DetailTile label="Charge state" value={vehicle.chargingState || 'Unavailable'} icon={Zap} />
              <DetailTile label="Speed" value={formatNumber(vehicle.speed || 0, ' mph')} icon={Navigation} />
              <DetailTile label="Odometer" value={vehicle.odometer ? formatNumber(vehicle.odometer, ' mi') : 'Unavailable'} icon={Gauge} />
              <DetailTile
                label="Locked"
                value={vehicle.locked === undefined ? 'Unavailable' : vehicle.locked ? 'Yes' : 'No'}
                icon={vehicle.locked === false ? LockOpen : Lock}
              />
              <DetailTile label="GPS freshness" value={vehicle.gpsAsOf ? 'Live' : 'Unavailable'} icon={MapPin} />
              <DetailTile label="Software" value={vehicle.softwareVersion || 'Unavailable'} icon={Cpu} />
              <DetailTile label="Heading" value={Number.isFinite(Number(vehicle.heading)) ? `${Math.round(vehicle.heading)}°` : 'Unavailable'} icon={Navigation} />
              <DetailTile label="State" value={vehicle.status || vehicle.state || 'Unavailable'} icon={Activity} />
            </div>
          </Card>

          <Button variant="secondary" className="w-full sm:w-auto" onClick={onSync} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing telemetry…' : 'Sync telemetry'}
          </Button>
        </div>
      )}

      {activeTab === 'controls' && (
        <div className="animate-fade-up space-y-4">
          <Card padding="p-3 sm:p-4" className="bg-surface">
            <p className="text-xs leading-relaxed text-ink-muted">
              Commands are queued for your approval before they reach the vehicle — nothing executes automatically.
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ControlButton
              icon={Power}
              label="Wake vehicle"
              hint="Bring telemetry online"
              onClick={() => queueControl(`Wake ${name} and refresh telemetry`, 'NORMAL')}
            />
            <ControlButton
              icon={Snowflake}
              label="Start climate"
              hint="Precondition cabin"
              onClick={() => queueControl(`Start climate preconditioning on ${name}`, 'NORMAL')}
            />
            <ControlButton
              icon={Zap}
              label="Start charging"
              hint="Begin a charge session"
              onClick={() => queueControl(`Start a charging session for ${name}`, 'HIGH')}
            />
            <ControlButton
              icon={vehicle.locked === false ? Lock : LockOpen}
              label={vehicle.locked === false ? 'Lock doors' : 'Unlock doors'}
              hint="Secure the vehicle"
              onClick={() =>
                queueControl(
                  vehicle.locked === false ? `Lock the doors on ${name}` : `Unlock the doors on ${name}`,
                  'NORMAL',
                )
              }
            />
            <ControlButton
              icon={Bell}
              label="Flash &amp; honk"
              hint="Locate the vehicle"
              onClick={() => queueControl(`Flash lights and honk to locate ${name}`, 'LOW')}
            />
            <ControlButton
              icon={Wrench}
              label="Schedule service"
              hint="Queue maintenance review"
              onClick={() => queueControl(`Schedule service review for ${name}`, 'NORMAL')}
            />
          </div>

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">AI review</p>
              <p className="mt-0.5 text-sm text-ink-muted">Let the agent analyze this vehicle and propose next steps.</p>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={() => queueControl(`AI review requested for ${name}`, 'AI')}
            >
              <Sparkles className="h-4 w-4" />
              Run AI review
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-fade-up">
          <HistoryTab vehicle={vehicle} />
        </div>
      )}
    </section>
  );
}
