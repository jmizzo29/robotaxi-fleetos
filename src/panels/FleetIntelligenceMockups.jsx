import { AlertTriangle, ArrowUpRight, BatteryCharging, CircleDollarSign, MapPin, ShieldCheck, Target, TrendingUp, Zap } from 'lucide-react';
import demandZones from '../data/demandZones';
import { monument, monumentType } from '../components/monument/monumentTokens';
import { getVehicleTelemetryIntelligence } from '../utils/telemetryIntelligence';

function money(value) {
  const num = Math.round(Number(value) || 0);
  return `$${num.toLocaleString()}`;
}

function percent(value) {
  const num = Math.round(Number(value) || 0);
  return `${num}%`;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function vehicleName(vehicle, index) {
  return vehicle.name || vehicle.display_name || vehicle.id || `Asset ${index + 1}`;
}

function revenueFor(vehicle, index) {
  const explicit = Number(vehicle.revenueToday ?? vehicle.todayRevenue ?? vehicle.earningsToday);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const revenue = Number(vehicle.revenue);
  if (Number.isFinite(revenue) && revenue > 0) return Math.round(revenue / 12);
  return Math.round((clamp(vehicle.utilization, 30, 95) / 100) * (340 + index * 32));
}

function healthFor(vehicle) {
  const score = Number(vehicle.maintenanceScore);
  if (Number.isFinite(score)) return clamp(score);
  const risk = Number(vehicle.anomalyRisk);
  if (Number.isFinite(risk)) return clamp(100 - risk);
  return 88;
}

function availabilityFor(vehicle) {
  const state = String(vehicle.status || vehicle.state || '').toUpperCase();
  if (state.includes('OFFLINE') || state.includes('ASLEEP')) return 0;
  if (state.includes('CHARG')) return 64;
  if (state.includes('SERVICE') || state.includes('MAINT')) return 52;
  return clamp(vehicle.utilization || 82, 44, 96);
}

function stateFor(vehicle) {
  const state = String(vehicle.status || vehicle.state || '').toUpperCase();
  if (state.includes('OFFLINE') || state.includes('ASLEEP')) return 'Offline';
  if (state.includes('CHARG')) return 'Charging';
  if (state.includes('PICKUP') || state.includes('SERVICE') || state.includes('EN ROUTE') || state.includes('REPOSITION')) return 'Earning';
  return 'Available';
}

function batteryFor(vehicle) {
  const battery = Number(vehicle.battery ?? vehicle.batteryLevel ?? vehicle.battery_level);
  return Number.isFinite(battery) ? clamp(battery) : null;
}

function syncFreshnessLabel(telemetry, confidence) {
  if (confidence.syncAgeMinutes === null) return 'sync pending';
  if (confidence.syncAgeMinutes < 1) return 'synced now';
  if (confidence.syncAgeMinutes < 60) return `${confidence.syncAgeMinutes}m sync`;
  return `${Math.floor(confidence.syncAgeMinutes / 60)}h sync`;
}

function locationLabel(vehicle, telemetry) {
  const city = vehicle?.city || vehicle?.location;
  if (city) return String(city).split(',')[0].trim();
  if (Number.isFinite(Number(telemetry.latitude)) && Number.isFinite(Number(telemetry.longitude))) {
    return `${Number(telemetry.latitude).toFixed(2)}, ${Number(telemetry.longitude).toFixed(2)}`;
  }
  return 'location pending';
}

function buildRows(fleet) {
  return fleet.map((vehicle, index) => {
    const intelligence = getVehicleTelemetryIntelligence(vehicle, { index });
    const revenue = revenueFor(vehicle, index);
    const availability = intelligence.availability.available ? intelligence.revenueReadiness.score : availabilityFor(vehicle);
    const health = intelligence.assetHealth.score ?? healthFor(vehicle);
    const battery = batteryFor(vehicle);
    const risk = clamp(vehicle.anomalyRisk || (100 - health));
    const score = Math.round((revenue / 70) + (availability * 0.35) + (health * 0.3) - (risk * 0.18));

    return {
      id: vehicle.id || `${index}`,
      name: vehicleName(vehicle, index),
      city: vehicle.city || vehicle.location || 'Location pending',
      revenue,
      availability,
      health,
      battery,
      utilization: clamp(vehicle.utilization || availability),
      risk,
      score: clamp(score),
      state: intelligence.activity.label || stateFor(vehicle),
      intelligence,
    };
  });
}

function Card({ option, title, children }) {
  return (
    <article
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}
    >
      <div className="flex items-start justify-between gap-4 border-b px-4 py-4" style={{ borderColor: monument.hairline }}>
        <div>
          <p className={monumentType.ledgerLabel} style={{ color: monument.action }}>
            {option ? `Mockup ${option}` : 'Fleet Intelligence'}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight" style={{ color: monument.ink }}>
            {title}
          </h2>
        </div>
        {option && (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold"
            style={{ color: monument.action, borderColor: monument.hairline, backgroundColor: monument.canvas }}
          >
            {option}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}

function QuestionHero({ question, answer, Icon = Target, tone = monument.money }) {
  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: monument.canvas, color: tone }}>
          <Icon className="h-4 w-4" />
        </span>
        <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>
          Intelligence Question
        </p>
      </div>
      <h3 className="mt-4 text-[34px] font-bold leading-none" style={{ color: monument.ink }}>
        {question}
      </h3>
      <p className="mt-4 text-[15px] leading-snug" style={{ color: monument.inkMuted }}>
        {answer}
      </p>
    </div>
  );
}

function StatTile({ label, value, sub, tone = monument.ink }) {
  return (
    <div className="rounded-lg border px-3 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
      <p className="text-[10px] font-semibold uppercase" style={{ color: monument.inkGhost }}>
        {label}
      </p>
      <p className="mt-1 text-[22px] font-bold leading-none" style={{ color: tone }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[11px] leading-tight" style={{ color: monument.inkMuted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function BarList({ rows, metric, color = monument.money, maxValue }) {
  const max = maxValue || Math.max(...rows.map((row) => Number(row[metric]) || 0), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = Number(row[metric]) || 0;
        return (
          <div key={row.id}>
            <div className="flex items-center justify-between gap-3 text-[12px] font-semibold">
              <span className="truncate" style={{ color: monument.ink }}>{row.name}</span>
              <span className="shrink-0 tabular-nums" style={{ color: monument.inkMuted }}>
                {metric === 'revenue' ? money(value) : percent(value)}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: monument.hairline }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(6, (value / max) * 100)}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionRow({ title, body, Icon, tone = monument.action }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border px-3 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: monument.surface, color: tone }}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[14px] font-bold leading-tight" style={{ color: monument.ink }}>{title}</p>
        <p className="mt-1 text-[12px] leading-snug" style={{ color: monument.inkMuted }}>{body}</p>
      </div>
    </div>
  );
}

function OptionA({ rows }) {
  const top = [...rows].sort((a, b) => b.revenue - a.revenue)[0];
  const risk = [...rows].sort((a, b) => b.risk - a.risk)[0];
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const avgAvail = rows.length ? rows.reduce((sum, row) => sum + row.availability, 0) / rows.length : 0;

  return (
    <Card option="A" title="Owner Daily Brief">
      <QuestionHero
        question="What needs my attention today?"
        answer={`${risk?.name || 'One asset'} has the highest risk signal. ${top?.name || 'Your top asset'} is carrying today's revenue.`}
        Icon={AlertTriangle}
        tone={monument.projected}
      />
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Revenue Today" value={money(totalRevenue)} tone={monument.money} />
        <StatTile label="Availability" value={percent(avgAvail)} tone={monument.action} />
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-lg border p-4" style={{ borderColor: monument.hairline }}>
          <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Revenue by Asset</p>
          <div className="mt-4">
            <BarList rows={[...rows].sort((a, b) => b.revenue - a.revenue)} metric="revenue" />
          </div>
        </div>
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title={`Protect ${risk?.name || 'highest-risk asset'}`} body="Review battery, health, and online status before peak demand." Icon={ShieldCheck} tone={monument.projected} />
        <ActionRow title={`Keep ${top?.name || 'top earner'} earning`} body="Avoid interrupting the asset currently generating the strongest return." Icon={CircleDollarSign} tone={monument.money} />
      </div>
    </Card>
  );
}

function Quadrant({ rows }) {
  return (
    <div className="relative h-[270px] rounded-xl border" style={{ borderColor: monument.hairline, backgroundColor: '#101318' }}>
      <div className="absolute left-1/2 top-5 bottom-9 w-px bg-white/10" />
      <div className="absolute left-9 right-5 top-1/2 h-px bg-white/10" />
      <p className="absolute left-3 top-3 text-[10px] font-semibold uppercase text-white/40">Higher Risk</p>
      <p className="absolute bottom-3 right-4 text-[10px] font-semibold uppercase text-white/40">Higher Revenue</p>
      {rows.map((row, index) => {
        const x = 14 + clamp(row.revenue / 75, 0, 78);
        const y = 82 - clamp(row.risk, 0, 72);
        const size = 38 + Math.round(row.availability / 7);
        return (
          <div
            key={row.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 text-center shadow-lg"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              backgroundColor: index === 0 ? monument.money : index === 1 ? monument.action : monument.projected,
            }}
          >
            <span className="flex h-full items-center justify-center text-[10px] font-bold text-white">
              {row.name.replace('CAR-', '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OptionB({ rows }) {
  const best = [...rows].sort((a, b) => (b.revenue - b.risk * 3) - (a.revenue - a.risk * 3))[0];
  const watch = [...rows].sort((a, b) => (b.risk + (100 - b.health)) - (a.risk + (100 - a.health)))[0];

  return (
    <Card option="B" title="Revenue vs Risk Matrix">
      <QuestionHero
        question="Which assets should I push, pause, or protect?"
        answer="A quadrant view shows which vehicles are earning safely and which ones need owner attention before more deployment."
        Icon={TrendingUp}
        tone={monument.money}
      />
      <div className="px-4 pb-4">
        <Quadrant rows={rows} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Push" value={best?.name || 'None'} sub="Best risk-adjusted return" tone={monument.money} />
        <StatTile label="Protect" value={watch?.name || 'None'} sub="Highest risk signal" tone={monument.projected} />
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title={`Prioritize ${best?.name || 'top asset'}`} body="Highest return with manageable risk based on current fleet fields." Icon={ArrowUpRight} tone={monument.money} />
        <ActionRow title={`Review ${watch?.name || 'risk asset'}`} body="Risk and health are drifting against revenue value." Icon={AlertTriangle} tone={monument.projected} />
      </div>
    </Card>
  );
}

function OpportunityMap({ rows }) {
  const topZones = [...demandZones].sort((a, b) => b.profitability - a.profitability).slice(0, 4);
  const cityCounts = rows.reduce((acc, row) => {
    const key = row.city.split(',')[0];
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());

  return (
    <div className="relative h-[260px] overflow-hidden rounded-xl border" style={{ borderColor: monument.hairline, backgroundColor: '#0F1318' }}>
      <div className="absolute inset-5 rounded-[42%] border border-white/10 bg-white/[0.03] rotate-[-14deg]" />
      <div className="absolute left-[42%] top-8 h-[180px] w-[78px] rounded-full border border-white/10 bg-white/[0.025] rotate-[18deg]" />
      {topZones.map((zone, index) => {
        const positions = [
          { left: '58%', top: '25%' },
          { left: '38%', top: '42%' },
          { left: '18%', top: '58%' },
          { left: '72%', top: '75%' },
        ];
        const assigned = cityCounts.get(zone.name.split(' ')[0]) || 0;
        return (
          <div key={zone.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={positions[index]}>
            <span
              className="absolute left-1/2 top-1/2 rounded-full opacity-25 blur-sm"
              style={{ width: zone.radius / 3, height: zone.radius / 3, marginLeft: -zone.radius / 6, marginTop: -zone.radius / 6, backgroundColor: zone.color }}
            />
            <span className="relative flex h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: zone.color }} />
            <div className="absolute left-5 top-1/2 min-w-[92px] -translate-y-1/2 rounded-lg border border-white/10 bg-black/55 px-2 py-1">
              <p className="text-[10px] font-bold leading-none text-white">{zone.name}</p>
              <p className="mt-1 text-[10px] font-semibold text-white/60">
                {zone.demand} demand · {assigned} assets
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OptionC({ rows }) {
  const bestZone = [...demandZones].sort((a, b) => b.profitability - a.profitability)[0];
  const idleAsset = [...rows].sort((a, b) => a.utilization - b.utilization)[0];

  return (
    <Card option="C" title="Deployment Advisor">
      <QuestionHero
        question="Where should I send the next available vehicle?"
        answer={`${bestZone?.name || 'The highest-demand zone'} is the strongest demand and profitability zone. ${idleAsset?.name || 'An idle asset'} is the best candidate to reposition.`}
        Icon={MapPin}
        tone={monument.action}
      />
      <div className="px-4 pb-4">
        <OpportunityMap rows={rows} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Best Zone" value={bestZone?.name.replace('Orlando ', '') || 'Airport'} sub={`${bestZone?.demand || 92} demand score`} tone={monument.action} />
        <StatTile label="Move Asset" value={idleAsset?.name || 'Asset'} sub="Lowest utilization" tone={monument.money} />
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title={`Stage ${idleAsset?.name || 'available asset'} near ${bestZone?.name || 'demand'}`} body="Use location, utilization, and demand zone data to turn idle capacity into earning time." Icon={Target} tone={monument.action} />
      </div>
    </Card>
  );
}

function TimelineSlot({ label, value, tone, height }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-end gap-2">
      <div className="flex h-[120px] w-full items-end rounded-lg border px-1.5 py-1.5" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
        <div className="w-full rounded-md" style={{ height, backgroundColor: tone }} />
      </div>
      <p className="text-[10px] font-semibold" style={{ color: monument.inkGhost }}>{label}</p>
      <p className="text-[11px] font-bold" style={{ color: monument.ink }}>{value}</p>
    </div>
  );
}

function OptionD({ rows }) {
  const lowBattery = rows.filter((row) => row.battery !== null && row.battery < 35).sort((a, b) => a.battery - b.battery)[0];
  const earning = rows.filter((row) => row.state === 'Earning').length;
  const chargingWindow = lowBattery ? `${lowBattery.name} after peak` : 'No urgent charging';

  return (
    <Card option="D" title="Daily Revenue Plan">
      <QuestionHero
        question="How do I maximize today without hurting tomorrow?"
        answer="A day-plan view connects earning windows, charging needs, and health risk into one owner decision."
        Icon={Zap}
        tone={monument.projected}
      />
      <div className="grid grid-cols-4 gap-2 px-4 pb-4">
        <TimelineSlot label="Now" value={`${earning} earning`} tone={monument.money} height="76%" />
        <TimelineSlot label="2 PM" value="Peak" tone={monument.action} height="88%" />
        <TimelineSlot label="6 PM" value="Protect" tone={monument.projected} height="54%" />
        <TimelineSlot label="10 PM" value="Charge" tone="#64748B" height="42%" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Charge Plan" value={chargingWindow} sub="Protects tomorrow" tone={monument.projected} />
        <StatTile label="Healthy Assets" value={`${rows.filter((row) => row.health >= 80).length}/${rows.length}`} sub="Ready to earn" tone={monument.money} />
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title={lowBattery ? `Charge ${lowBattery.name} after peak demand` : 'Keep all assets available'} body="Battery is supporting data; the real decision is when charging least damages revenue." Icon={BatteryCharging} tone={monument.projected} />
      </div>
    </Card>
  );
}

function LeakSegment({ label, amount, width, tone }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[12px] font-semibold">
        <span style={{ color: monument.ink }}>{label}</span>
        <span className="tabular-nums" style={{ color: monument.inkMuted }}>{money(amount)}</span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full" style={{ backgroundColor: monument.hairline }}>
        <div className="h-full rounded-full" style={{ width, backgroundColor: tone }} />
      </div>
    </div>
  );
}

function OptionE({ rows }) {
  const idle = [...rows].sort((a, b) => a.utilization - b.utilization)[0];
  const risk = [...rows].sort((a, b) => b.risk - a.risk)[0];
  const unavailable = rows.filter((row) => row.state === 'Offline' || row.state === 'Charging').length;
  const idleLeak = Math.round((100 - (idle?.utilization || 0)) * 6.5);
  const riskLeak = Math.round((risk?.risk || 0) * 5.2);
  const offlineLeak = Math.round(unavailable * 185);
  const totalLeak = idleLeak + riskLeak + offlineLeak;
  const max = Math.max(idleLeak, riskLeak, offlineLeak, 1);

  return (
    <Card option="E" title="Profit Leak Finder">
      <QuestionHero
        question="Where is money leaking out of my fleet?"
        answer={`${idle?.name || 'One asset'} is the biggest idle-capacity leak. ${risk?.name || 'One asset'} is the biggest protection leak.`}
        Icon={CircleDollarSign}
        tone={monument.money}
      />
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Est. Leak" value={money(totalLeak)} sub="Today at risk" tone={monument.projected} />
        <StatTile label="Fix First" value={idle?.name || 'Asset'} sub="Lowest utilization" tone={monument.money} />
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-lg border p-4" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
          <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Leak Sources</p>
          <div className="mt-4 space-y-4">
            <LeakSegment label="Idle capacity" amount={idleLeak} width={`${Math.max(10, (idleLeak / max) * 100)}%`} tone={monument.money} />
            <LeakSegment label="Risk drag" amount={riskLeak} width={`${Math.max(10, (riskLeak / max) * 100)}%`} tone={monument.projected} />
            <LeakSegment label="Unavailable time" amount={offlineLeak} width={`${Math.max(10, (offlineLeak / max) * 100)}%`} tone={monument.action} />
          </div>
        </div>
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title={`Recover idle time from ${idle?.name || 'the lowest-use asset'}`} body="Reposition or price this asset before adding more vehicles." Icon={ArrowUpRight} tone={monument.money} />
      </div>
    </Card>
  );
}

function ScoreStrip({ label, value, tone }) {
  return (
    <div className="rounded-lg border px-3 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold" style={{ color: monument.ink }}>{label}</p>
        <p className="text-[13px] font-bold tabular-nums" style={{ color: tone }}>{percent(value)}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: monument.hairline }}>
        <div className="h-full rounded-full" style={{ width: `${clamp(value, 6, 100)}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}

function OptionF({ rows }) {
  const scored = [...rows].map((row) => ({
    ...row,
    capitalScore: Math.round((row.revenue / 7) + row.availability * 0.32 + row.health * 0.28 - row.risk * 0.2),
  })).sort((a, b) => b.capitalScore - a.capitalScore);
  const leader = scored[0];
  const laggard = scored[scored.length - 1];

  return (
    <Card option="F" title="Capital Allocation">
      <QuestionHero
        question="Which asset deserves more investment?"
        answer={`${leader?.name || 'The lead asset'} has the best blend of earnings, availability, and health. ${laggard?.name || 'The laggard'} needs proof before more capital.`}
        Icon={Target}
        tone={monument.action}
      />
      <div className="px-4 pb-4">
        <div className="rounded-xl border p-4" style={{ borderColor: monument.hairline }}>
          <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>Capital Score</p>
          <div className="mt-4 space-y-2.5">
            {scored.map((row) => (
              <ScoreStrip key={row.id} label={row.name} value={row.capitalScore} tone={row === leader ? monument.money : monument.action} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
        <StatTile label="Fund" value={leader?.name || 'Asset'} sub="Best capital score" tone={monument.money} />
        <StatTile label="Hold" value={laggard?.name || 'Asset'} sub="Needs improvement" tone={monument.projected} />
      </div>
    </Card>
  );
}

function Chip({ label, value }) {
  return (
    <span
      className="min-w-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none"
      style={{ borderColor: monument.hairline, color: monument.inkMuted, backgroundColor: monument.surface }}
    >
      <span className="text-[9px] uppercase" style={{ color: monument.inkGhost }}>{label}</span>
      {' '}
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function serviceReadinessLabel(readiness) {
  if (readiness.score >= 90) return 'Ready For Service';
  if (readiness.score >= 75) return 'Available For Service';
  if (readiness.score >= 50) return 'Limited Service';
  return 'Hold Back';
}

function ReadinessRail({ row }) {
  const intelligence = row.intelligence;
  const readiness = intelligence.revenueReadiness.score;
  const tone = readiness >= 90 ? monument.money : readiness >= 75 ? monument.action : monument.projected;
  const telemetry = intelligence.telemetry;
  const battery = telemetry.battery ?? row.battery;
  const action = intelligence.attention.recommendedAction;
  const availabilityTone = intelligence.availability.available ? monument.money : monument.projected;
  const healthTone = intelligence.assetHealth.state === 'attention' || intelligence.assetHealth.state === 'watch'
    ? monument.projected
    : monument.money;

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold leading-tight" style={{ color: monument.ink }}>{row.name}</p>
          <p className="mt-1 text-[11px] font-semibold" style={{ color: tone }}>
            {serviceReadinessLabel(intelligence.revenueReadiness)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase" style={{ color: monument.inkGhost }}>Ready For Service</p>
          <p className="mt-1 text-[28px] font-bold leading-none tabular-nums" style={{ color: tone }}>{readiness}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatTile label="Health" value={intelligence.assetHealth.label} sub={`${intelligence.assetHealth.score}/100`} tone={healthTone} />
        <StatTile label="Availability" value={intelligence.availability.label} sub={intelligence.availability.reason} tone={availabilityTone} />
      </div>

      <div className="mt-3 rounded-lg border px-3 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}>
        <p className={monumentType.ledgerLabel} style={{ color: monument.inkGhost }}>
          Recommended Action
        </p>
        <p className="mt-1 text-[13px] font-semibold leading-snug" style={{ color: monument.ink }}>
          {action}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip label="battery" value={battery === null || battery === undefined ? '--' : percent(battery)} />
        <Chip label="sync" value={syncFreshnessLabel(telemetry, intelligence.confidence)} />
        <Chip label="charge" value={telemetry.chargingState || 'idle'} />
        <Chip label="place" value={locationLabel(row, telemetry)} />
      </div>
    </div>
  );
}

function OptionG({ rows, production = false }) {
  const ready = rows
    .map((row) => ({
      ...row,
      readiness: row.intelligence.revenueReadiness.score,
    }))
    .sort((a, b) => b.readiness - a.readiness);
  const topReady = ready[0];
  const notReady = ready.filter((row) => row.readiness < 70).length;

  return (
    <Card option={production ? null : 'G'} title="Earning Readiness">
      <QuestionHero
        question="Which vehicles are safe to send out now?"
        answer={`${topReady?.name || 'One asset'} is most ready to earn. ${notReady} asset${notReady === 1 ? '' : 's'} should be held back or checked first.`}
        Icon={ShieldCheck}
        tone={monument.money}
      />
      <div className="space-y-2.5 px-4 pb-4">
        {ready.map((row) => (
          <ReadinessRail key={row.id} row={row} />
        ))}
      </div>
    </Card>
  );
}

function ScenarioColumn({ label, value, sub, tone, height }) {
  return (
    <div className="flex flex-col items-center justify-end gap-2">
      <div className="flex h-[150px] w-full items-end rounded-xl border px-3 py-3" style={{ borderColor: monument.hairline, backgroundColor: monument.canvas }}>
        <div className="w-full rounded-lg" style={{ height, backgroundColor: tone }} />
      </div>
      <p className="text-[11px] font-bold" style={{ color: monument.ink }}>{label}</p>
      <p className="text-[15px] font-bold tabular-nums" style={{ color: tone }}>{value}</p>
      <p className="text-center text-[10px] leading-tight" style={{ color: monument.inkGhost }}>{sub}</p>
    </div>
  );
}

function OptionH({ rows }) {
  const currentRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const avgAsset = rows.length ? currentRevenue / rows.length : 0;
  const nextVehicleLift = Math.round(avgAsset * 0.82);
  const optimizeLift = Math.round(currentRevenue * 0.18);
  const totalExpansion = currentRevenue + nextVehicleLift;
  const totalOptimize = currentRevenue + optimizeLift;

  return (
    <Card option="H" title="Growth Scenario">
      <QuestionHero
        question="Should I add a vehicle or optimize the fleet I have?"
        answer={`Adding one vehicle could lift revenue more, but optimization recovers ${money(optimizeLift)} without new asset risk.`}
        Icon={TrendingUp}
        tone={monument.money}
      />
      <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
        <ScenarioColumn label="Now" value={money(currentRevenue)} sub="Current fleet" tone="#64748B" height="52%" />
        <ScenarioColumn label="Optimize" value={money(totalOptimize)} sub="No new vehicle" tone={monument.action} height="68%" />
        <ScenarioColumn label="Add +1" value={money(totalExpansion)} sub="New asset" tone={monument.money} height="84%" />
      </div>
      <div className="space-y-2.5 px-4 pb-4">
        <ActionRow title="Optimize first, then expand" body="If idle time and risk are not fixed, a new vehicle may amplify the same operating leaks." Icon={Target} tone={monument.action} />
      </div>
    </Card>
  );
}

export default function FleetIntelligenceMockups({ fleet = [] }) {
  const rows = buildRows(fleet);
  const showMockupBoard = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('mock');

  return (
    <section className="flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas }}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-[440px] space-y-4 pb-4">
          <div className="rounded-xl border px-5 py-5" style={{ backgroundColor: monument.surface, borderColor: monument.hairline }}>
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>
              {showMockupBoard ? 'Fleet Intelligence Mockups' : 'Asset Performance Center'}
            </p>
            <h1 className="mt-3 text-[36px] font-bold leading-none" style={{ color: monument.ink }}>
              {showMockupBoard ? 'Real questions owners ask' : 'Which vehicles are safe to send out now?'}
            </h1>
            <p className="mt-4 text-[14px] leading-snug" style={{ color: monument.inkMuted }}>
              {showMockupBoard
                ? 'Eight ways ROBOAGENT can turn Tesla/fleet fields into decisions about revenue, risk, deployment, charging, and expansion.'
                : 'ROBOAGENT ranks each asset by availability, health, energy, and risk so owners know what can earn and what should be held back.'}
            </p>
          </div>

          {showMockupBoard ? (
            <>
              <OptionA rows={rows} />
              <OptionB rows={rows} />
              <OptionC rows={rows} />
              <OptionD rows={rows} />
              <OptionE rows={rows} />
              <OptionF rows={rows} />
              <OptionG rows={rows} />
              <OptionH rows={rows} />
            </>
          ) : (
            <OptionG rows={rows} production />
          )}
        </div>
      </div>
    </section>
  );
}
