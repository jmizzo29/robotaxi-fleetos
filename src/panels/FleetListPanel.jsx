import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, MapPin, Zap } from 'lucide-react';
import { monument, monumentType } from '../components/monument/monumentTokens';

function money(value) {
  const num = Math.round(Number(value) || 0);
  return `$${num.toLocaleString()}`;
}

function percent(value) {
  const num = Math.round(Number(value) || 0);
  return `${num}%`;
}

function nameFor(vehicle, index) {
  return vehicle.name || vehicle.display_name || vehicle.id || `Asset ${index + 1}`;
}

function cityFor(vehicle) {
  return vehicle.city || vehicle.location || 'Location pending';
}

function stateText(vehicle) {
  return String(vehicle.status || vehicle.state || '').toUpperCase();
}

function revenueFor(vehicle, index) {
  const explicit = Number(vehicle.revenueToday ?? vehicle.todayRevenue ?? vehicle.earningsToday);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const revenue = Number(vehicle.revenue);
  if (Number.isFinite(revenue) && revenue > 0) return vehicle.isReal ? revenue : Math.round(revenue / 12);
  const utilization = Number(vehicle.utilization);
  if (Number.isFinite(utilization)) return Math.round((utilization / 100) * (320 + index * 18));
  return 0;
}

function healthFor(vehicle) {
  const score = Number(vehicle.maintenanceScore);
  if (Number.isFinite(score)) return Math.max(0, Math.min(100, Math.round(score)));
  const risk = Number(vehicle.anomalyRisk);
  if (Number.isFinite(risk)) return Math.max(0, Math.min(100, Math.round(100 - risk)));
  return 90;
}

function availabilityFor(vehicle) {
  const state = stateText(vehicle);
  if (state.includes('OFFLINE') || state.includes('SLEEP')) return 0;
  if (state.includes('SERVICE') || state.includes('MAINT')) return 54;
  if (state.includes('CHARG')) return 72;
  const utilization = Number(vehicle.utilization);
  if (Number.isFinite(utilization)) return Math.max(48, Math.min(96, Math.round(utilization)));
  return 88;
}

function assetState(vehicle) {
  const state = stateText(vehicle);
  const health = healthFor(vehicle);
  const battery = Number(vehicle.battery || vehicle.batteryLevel || vehicle.battery_level);
  const risk = Number(vehicle.anomalyRisk);

  if (state.includes('OFFLINE') || state.includes('SLEEP')) {
    return { key: 'offline', label: 'Offline', color: '#B42318', wash: '#FEEBE9', Icon: AlertTriangle };
  }
  if (state.includes('SERVICE') || state.includes('MAINT') || health < 55 || risk >= 30 || battery < 20) {
    return { key: 'attention', label: 'Needs Attention', color: monument.projected, wash: '#FFF5D6', Icon: AlertTriangle };
  }
  if (state.includes('CHARG')) {
    return { key: 'charging', label: 'Charging', color: monument.action, wash: '#EAF0FF', Icon: Zap };
  }
  if (state.includes('EN ROUTE') || state.includes('PICKUP') || state.includes('REPOSITION') || state.includes('ACTIVE')) {
    return { key: 'earning', label: 'Earning', color: monument.money, wash: '#EAF6EF', Icon: DollarSign };
  }
  return { key: 'available', label: 'Available', color: monument.action, wash: '#EAF0FF', Icon: CheckCircle2 };
}

function buildRows(fleet) {
  return fleet.map((vehicle, index) => ({
    id: vehicle.id || `${index}`,
    vehicle,
    name: nameFor(vehicle, index),
    location: cityFor(vehicle),
    revenue: revenueFor(vehicle, index),
    availability: availabilityFor(vehicle),
    health: healthFor(vehicle),
    energy: Number(vehicle.battery || vehicle.batteryLevel || vehicle.battery_level),
    state: assetState(vehicle),
  }));
}

function StatusPill({ state }) {
  const Icon = state.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: state.wash, color: state.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {state.label}
    </span>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-lg border px-2 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
      <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>{label}</p>
      <p className="mt-1 text-[22px] font-semibold leading-none" style={{ color: monument.ink }}>{value}</p>
    </div>
  );
}

function PriorityCard({ title, row, tone, onSelect }) {
  if (!row) return null;
  const color = tone === 'money' ? monument.money : monument.projected;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row.vehicle)}
      className="w-full rounded-lg border px-4 py-4 text-left transition active:scale-[0.99]"
      style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
    >
      <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>{title}</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold" style={{ color: monument.ink }}>{row.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: monument.inkMuted }}>
            <MapPin className="h-3.5 w-3.5" />
            {row.location}
          </p>
        </div>
        <p className="shrink-0 text-[24px] font-semibold tracking-[-0.04em]" style={{ color }}>{money(row.revenue)}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <SmallStat label="Avail." value={percent(row.availability)} />
        <SmallStat label="Health" value={percent(row.health)} />
        <SmallStat label="Energy" value={Number.isFinite(row.energy) ? percent(row.energy) : '--'} />
      </div>
    </button>
  );
}

function PortfolioRow({ row, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(row.vehicle)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition hover:bg-black/[0.025]"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold" style={{ color: monument.ink }}>{row.name}</p>
        <p className="text-[11px]" style={{ color: monument.inkGhost }}>{row.state.label}</p>
      </div>
      <p className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: monument.inkMuted }}>
        {money(row.revenue)}
      </p>
    </button>
  );
}

export default function FleetListPanel({ fleet = [], onSelect }) {
  const rows = useMemo(() => buildRows(fleet), [fleet]);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const activeCount = rows.filter((row) => ['earning', 'available', 'charging'].includes(row.state.key)).length;
  const attentionCount = rows.filter((row) => ['attention', 'offline'].includes(row.state.key)).length;
  const avgAvailability = rows.length
    ? rows.reduce((sum, row) => sum + row.availability, 0) / rows.length
    : 0;
  const sortedByRevenue = [...rows].sort((a, b) => b.revenue - a.revenue);
  const topEarner = sortedByRevenue[0] || rows[0] || null;
  const attentionAsset = rows.find((row) => row.state.key === 'attention' || row.state.key === 'offline') || null;

  return (
    <section className="min-h-full" style={{ backgroundColor: monument.canvas }}>
      <div className="mx-auto max-w-[1180px] space-y-4 px-4 py-5 lg:px-6">
        <div className="rounded-xl border px-5 py-5" style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}>
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>Asset Performance Center</p>
          <h1 className="mt-3 max-w-[44rem] text-[38px] font-semibold leading-[0.96] tracking-[-0.05em] sm:text-[48px]" style={{ color: monument.ink }}>
            How are my assets performing?
          </h1>
          <p className="mt-4 max-w-[42rem] text-[15px] leading-relaxed" style={{ color: monument.inkMuted }}>
            Monitor fleet health, availability, revenue, and performance across your vehicles.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[24rem] flex-col justify-center rounded-lg border px-5 py-6 text-center" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>Fleet Pulse</p>
            <p className="mt-5 text-[68px] font-bold leading-none tracking-[-0.06em]" style={{ color: monument.money }}>
              {money(totalRevenue)}
            </p>
            <p className="mt-4 text-[16px]" style={{ color: monument.inkMuted }}>
              Revenue today across performing assets
            </p>
            <div className="mx-auto mt-7 grid w-full max-w-[18rem] grid-cols-3 gap-2">
              <SmallStat label="Active" value={`${activeCount}/${rows.length}`} />
              <SmallStat label="Avail." value={percent(avgAvailability)} />
              <SmallStat label="Attention" value={String(attentionCount)} />
            </div>
          </div>

          <div className="space-y-3">
            <PriorityCard title="Top Earning Asset" row={topEarner} tone="money" onSelect={onSelect} />
            {attentionAsset ? (
              <PriorityCard title="Needs Owner Attention" row={attentionAsset} tone="projected" onSelect={onSelect} />
            ) : (
              <div className="rounded-lg border px-4 py-4" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
                <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Needs Owner Attention</p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusPill state={{ label: 'All Clear', wash: '#EAF6EF', color: monument.money, Icon: CheckCircle2 }} />
                  <p className="text-[14px]" style={{ color: monument.inkMuted }}>No asset requires attention right now.</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border px-4 py-4" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
              <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Portfolio View</p>
              <div className="mt-3 space-y-1">
                {sortedByRevenue.slice(0, 5).map((row) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <StatusPill state={row.state} />
                    <PortfolioRow row={row} onSelect={onSelect} />
                  </div>
                ))}
                {rows.length === 0 && (
                  <p className="py-3 text-[13px]" style={{ color: monument.inkMuted }}>
                    Connect vehicles to begin tracking asset performance.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
