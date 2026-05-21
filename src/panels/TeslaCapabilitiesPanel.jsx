import { useMemo, useState } from 'react';
import { wakeTeslaVehicle } from '../services/teslaService';

const capabilityGroups = [
  {
    title: 'Telemetry In Use',
    description: 'What FleetOS is already reading from your Tesla Fleet API connection.',
    items: [
      ['Vehicle identity', 'VIN, display name, online/asleep state'],
      ['Location', 'GPS coordinates, heading, last GPS timestamp'],
      ['Battery', 'Charge percentage and charging state'],
      ['Vehicle state', 'Odometer, speed, lock state, service mode, software version'],
    ],
  },
  {
    title: 'Safe Controls',
    description: 'Low-risk operator actions we can expose first.',
    items: [
      ['Sync telemetry', 'Refresh the latest Fleet API vehicle data'],
      ['Wake vehicle', 'Ask Tesla to bring an asleep vehicle online'],
      ['Show on map', 'Jump the operations view to the selected vehicle'],
      ['AI review', 'Ask the FleetOS AI layer to explain risk and next best action'],
    ],
  },
  {
    title: 'Next Tesla Commands',
    description: 'Useful owner commands to add after virtual-key and confirmation flows are hardened.',
    items: [
      ['Charging', 'Start/stop charging, set charge limit, manage charging windows'],
      ['Security', 'Lock/unlock, flash lights, honk horn'],
      ['Climate', 'Precondition cabin, defrost, adjust temperature'],
      ['Access', 'Open/close trunk or frunk where supported'],
    ],
  },
];

function Metric({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function CapabilityCard({ group }) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
        Tesla Fleet API
      </p>
      <h2 className="text-2xl font-black tracking-tight">{group.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{group.description}</p>

      <div className="mt-5 space-y-3">
        {group.items.map(([name, detail]) => (
          <div key={name} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/30" />
              <div>
                <p className="font-bold text-slate-100">{name}</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">{detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function TeslaCapabilitiesPanel({
  vehicle,
  syncStatus,
  isLoading,
  onSync,
  onShowMap,
  onQueueCommand,
}) {
  const [wakeStatus, setWakeStatus] = useState(null);
  const vehicleState = vehicle?.state || vehicle?.status || 'simulation';
  const lastSynced = useMemo(() => {
    const stamp = vehicle?.syncedAt || syncStatus?.lastSyncedAt;
    return stamp ? new Date(stamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Pending';
  }, [syncStatus?.lastSyncedAt, vehicle?.syncedAt]);

  const handleWake = async () => {
    if (!vehicle) return;

    setWakeStatus({ state: 'loading', message: 'Sending wake request to Tesla...' });

    try {
      const response = await wakeTeslaVehicle(vehicle);
      setWakeStatus({
        state: 'success',
        message: `Wake request accepted. Tesla state: ${response.state || response.vehicle_state || 'processing'}.`,
      });
      onQueueCommand?.(`Wake request sent for ${vehicle.name || vehicle.display_name || vehicle.id}`, 'MEDIUM');
      window.setTimeout(() => onSync?.(), 1800);
    } catch (error) {
      setWakeStatus({ state: 'error', message: error.message });
    }
  };

  const handleAiReview = () => {
    onQueueCommand?.(
      `AI review requested for ${vehicle?.name || vehicle?.display_name || 'Tesla vehicle'} controls and telemetry`,
      'HIGH',
    );
  };

  return (
    <section className="space-y-5">
      <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Tesla Operations</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              API Capabilities & Controls
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              FleetOS is using Tesla telemetry today and can now expose a controlled command surface. Riskier commands should stay gated behind virtual-key readiness, confirmation dialogs, and audit logging.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Metric label="Vehicle" value={vehicle?.name || vehicle?.display_name || 'No Tesla'} tone="text-emerald-300" />
              <Metric label="State" value={vehicleState} tone={vehicleState === 'online' ? 'text-emerald-300' : 'text-amber-300'} />
              <Metric label="Battery" value={vehicle?.battery !== undefined ? `${vehicle.battery}%` : 'Pending'} tone="text-sky-300" />
              <Metric label="Synced" value={lastSynced} tone="text-violet-300" />
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/55 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operator Actions</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                type="button"
                onClick={onSync}
                disabled={isLoading}
                className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-left text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? 'Syncing...' : 'Sync Telemetry'}
              </button>
              <button
                type="button"
                onClick={handleWake}
                disabled={!vehicle || wakeStatus?.state === 'loading'}
                className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-left text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {wakeStatus?.state === 'loading' ? 'Waking...' : 'Wake Vehicle'}
              </button>
              <button
                type="button"
                onClick={onShowMap}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                Show On Map
              </button>
              <button
                type="button"
                onClick={handleAiReview}
                className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-left text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                AI Review
              </button>
            </div>

            {wakeStatus && (
              <div
                className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${
                  wakeStatus.state === 'error'
                    ? 'border-red-400/20 bg-red-400/10 text-red-100'
                    : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                }`}
              >
                {wakeStatus.message}
              </div>
            )}
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {capabilityGroups.map((group) => (
          <CapabilityCard key={group.title} group={group} />
        ))}
      </div>
    </section>
  );
}
