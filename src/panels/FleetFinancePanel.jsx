import { getVehicleOwnership } from '../data/vehicleOwnership';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function vehicleFinance(vehicle) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
  const revenue = Number(vehicle.revenue) || 0;
  const monthlyPayment = Number(ownership.monthlyPayment) || 0;
  const chargingCost = Math.max(95, Math.round(revenue * 0.075));
  const insuranceCost = vehicle.isReal ? 210 : 185;
  const maintenanceReserve = Math.round(revenue * ((100 - (vehicle.maintenanceScore || 85)) / 100) * 0.2 + 95);
  const operatingCost = monthlyPayment + chargingCost + insuranceCost + maintenanceReserve;
  const netProfit = revenue - operatingCost;
  const pricePaid = Number(ownership.pricePaid) || 0;
  const currentBalance = Number(ownership.currentBalance) || 0;
  const equity = Math.max(0, pricePaid - currentBalance);
  const roi = pricePaid ? (netProfit * 12 / pricePaid) * 100 : 0;

  return {
    vehicle,
    ownership,
    revenue,
    monthlyPayment,
    chargingCost,
    insuranceCost,
    maintenanceReserve,
    operatingCost,
    netProfit,
    equity,
    roi,
    margin: revenue ? (netProfit / revenue) * 100 : 0,
  };
}

function Metric({ label, value, tone = 'text-slate-100', helper }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
      {helper && <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>}
    </div>
  );
}

function RoiBar({ value }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  const color = normalized < 15 ? 'bg-amber-300' : normalized < 35 ? 'bg-sky-300' : 'bg-emerald-300';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-950">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${normalized}%` }} />
    </div>
  );
}

function FinanceRow({ item, onQueueCommand }) {
  const { vehicle, ownership, revenue, operatingCost, netProfit, margin, roi, equity } = item;
  const positive = netProfit >= 0;

  const handleReview = () => {
    onQueueCommand?.(
      `Finance review requested for ${vehicle.name || vehicle.display_name || vehicle.id}: ${formatCurrency(netProfit)} monthly net, ${formatPercent(roi)} annualized ROI`,
      roi < 15 ? 'HIGH' : 'NORMAL',
    );
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
              {ownership.tag || vehicle.id}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
              positive ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/25 bg-rose-400/10 text-rose-200'
            }`}>
              {positive ? 'Profitable' : 'Loss Watch'}
            </span>
          </div>
          <h3 className="truncate text-2xl font-black tracking-tight">
            {vehicle.name || vehicle.display_name || vehicle.id}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {ownership.modelYear || 'Unknown'} {ownership.model || 'Vehicle'} - {ownership.color || 'Color unavailable'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          className="rounded-md border border-violet-400/30 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
        >
          AI Finance Review
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Revenue" value={formatCurrency(revenue)} tone="text-sky-300" />
        <Metric label="Operating Cost" value={formatCurrency(operatingCost)} tone="text-amber-300" />
        <Metric label="Net Profit" value={formatCurrency(netProfit)} tone={positive ? 'text-emerald-300' : 'text-rose-300'} />
        <Metric label="Equity" value={formatCurrency(equity)} tone="text-slate-100" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-slate-400">Annualized ROI</span>
            <span className="font-black text-slate-100">{formatPercent(roi)}</span>
          </div>
          <RoiBar value={roi} />
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Margin</span>
            <span className="font-black text-slate-100">{formatPercent(margin)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-400">Loan Payment</span>
            <span className="font-black text-slate-100">{formatCurrency(item.monthlyPayment)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FleetFinancePanel({ fleet = [], onQueueCommand }) {
  const finance = fleet.map(vehicleFinance);
  const totalRevenue = finance.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = finance.reduce((sum, item) => sum + item.operatingCost, 0);
  const totalNet = finance.reduce((sum, item) => sum + item.netProfit, 0);
  const totalEquity = finance.reduce((sum, item) => sum + item.equity, 0);
  const avgRoi = finance.length
    ? finance.reduce((sum, item) => sum + item.roi, 0) / finance.length
    : 0;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Monthly Revenue" value={formatCurrency(totalRevenue)} tone="text-sky-300" />
        <Metric label="Operating Cost" value={formatCurrency(totalCost)} tone="text-amber-300" />
        <Metric label="Net Profit" value={formatCurrency(totalNet)} tone={totalNet >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        <Metric label="Fleet Equity" value={formatCurrency(totalEquity)} tone="text-violet-300" />
        <Metric label="Avg ROI" value={formatPercent(avgRoi)} tone="text-emerald-300" helper="Annualized estimate" />
      </div>

      <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Monetization Core
        </p>
        <h2 className="text-2xl font-black tracking-tight">Fleet Profitability Model</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          This is the kind of view an owner pays for: vehicle-level ROI, loan exposure, operating cost, margin, and AI finance review. Current costs are modeled from your asset records and live/simulated operating signals, then can later be replaced with accounting imports.
        </p>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {finance
          .sort((a, b) => a.roi - b.roi)
          .map((item) => (
            <FinanceRow
              key={item.vehicle.vin || item.vehicle.id}
              item={item}
              onQueueCommand={onQueueCommand}
            />
          ))}
      </div>
    </section>
  );
}
