import { useEffect, useState } from 'react';
import { getVehicleOwnership } from '../data/vehicleOwnership';
import {
  addRevenueRecord,
  importRevenueRecords,
  parseRevenueCsv,
  parseTuroCsv,
  readRevenueRecords,
  revenueForVehicle,
  syncRevenueFromBackend,
} from '../services/revenueService';
import { buildFleetPricingSummary, buildPricingRecommendations } from '../services/pricingAgentService';

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

const MARKET_RATE_KEY = 'fleetos_pricing_market_inputs';

function readMarketInputs() {
  if (typeof window === 'undefined') {
    return {
      currentDailyRate: '',
      competitorAverage: '',
      minimumDailyRate: '',
      targetDailyRate: '',
    };
  }

  try {
    return {
      currentDailyRate: '',
      competitorAverage: '',
      minimumDailyRate: '',
      targetDailyRate: '',
      ...JSON.parse(window.localStorage.getItem(MARKET_RATE_KEY) || '{}'),
    };
  } catch {
    return {
      currentDailyRate: '',
      competitorAverage: '',
      minimumDailyRate: '',
      targetDailyRate: '',
    };
  }
}

function vehicleFinance(vehicle, revenueRecords = []) {
  const ownership = vehicle.ownership || getVehicleOwnership(vehicle) || {};
  const importedRevenue = revenueForVehicle(vehicle, revenueRecords);
  const revenue = importedRevenue || Number(vehicle.revenue) || 0;
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
    revenueSource: importedRevenue ? 'Ledger' : 'Modeled',
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
  const { vehicle, ownership, revenue, revenueSource, operatingCost, netProfit, margin, roi, equity } = item;
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
          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-400">Revenue Source</span>
            <span className="font-black text-slate-100">{revenueSource}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function RevenueTracker({ fleet, records, onRecordsChanged }) {
  const [draft, setDraft] = useState({
    vehicleKey: fleet[0]?.vin || fleet[0]?.id || '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    source: 'Manual',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [turoSummary, setTuroSummary] = useState(null);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const addManual = async () => {
    setMessage('Saving revenue record...');
    try {
      await addRevenueRecord({
        ...draft,
        vehicleLabel: fleet.find((vehicle) => [vehicle.vin, vehicle.id].includes(draft.vehicleKey))?.name || draft.vehicleKey,
      });
      setDraft((current) => ({ ...current, amount: '', notes: '' }));
      setMessage('Revenue record saved to Postgres.');
      onRecordsChanged?.();
    } catch (error) {
      setMessage(error.message || 'Revenue record could not be saved.');
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseRevenueCsv(text);
    setMessage(`Importing ${parsed.length} CSV revenue records...`);
    try {
      await importRevenueRecords(parsed);
      setMessage(`${parsed.length} CSV revenue records saved to Postgres.`);
      onRecordsChanged?.();
      event.target.value = '';
    } catch (error) {
      setMessage(error.message || 'CSV revenue import failed.');
    }
  };

  const importTuroCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseTuroCsv(text);
    setTuroSummary(parsed.summary);
    setMessage(`Importing ${parsed.records.length} Turo trip earning records...`);
    try {
      await importRevenueRecords(parsed.records);
      setMessage(`${parsed.records.length} Turo records saved. FleetOS parsed reservations, earnings, trips, and utilization signals.`);
      onRecordsChanged?.();
      event.target.value = '';
    } catch (error) {
      setMessage(error.message || 'Turo CSV import failed.');
    }
  };

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Revenue Tracking
          </p>
          <h2 className="text-2xl font-black tracking-tight">Manual + CSV Ledger</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Tesla does not report rental income. FleetOS starts with honest owner-entered revenue and Turo Host CSV imports, then uses that ledger for ROI, utilization, and trip economics.
          </p>
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-400">
            {records.length} revenue records saved. CSV headers supported: <span className="font-bold text-slate-200">vin, vehicle, amount, date, source, notes</span>.
          </div>
          <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/10 p-3 text-sm leading-6 text-sky-100">
            Export your Turo <span className="font-black">Earnings Report</span> or <span className="font-black">Trip History</span> CSV from the Turo Host dashboard, then upload it here. FleetOS will parse reservations, earnings, trips, booked days, and utilization.
          </div>
          {turoSummary && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm lg:grid-cols-3">
              <Metric label="Turo Earnings" value={formatCurrency(turoSummary.earnings)} tone="text-emerald-300" />
              <Metric label="Trips" value={turoSummary.trips} tone="text-sky-300" />
              <Metric label="Reservations" value={turoSummary.reservations} tone="text-violet-300" />
              <Metric label="Booked Days" value={turoSummary.bookedDays} tone="text-amber-300" />
              <Metric label="Vehicles" value={turoSummary.vehicles} tone="text-slate-100" />
              <Metric label="Utilization" value={turoSummary.utilization === null ? 'n/a' : `${turoSummary.utilization}%`} tone="text-emerald-300" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={draft.vehicleKey}
            onChange={(event) => update('vehicleKey', event.target.value)}
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
          >
            {fleet.map((vehicle) => (
              <option key={vehicle.vin || vehicle.id} value={vehicle.vin || vehicle.id}>
                {vehicle.name || vehicle.display_name || vehicle.id}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={draft.amount}
            onChange={(event) => update('amount', event.target.value)}
            placeholder="Revenue amount"
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
          />
          <input
            type="date"
            value={draft.date}
            onChange={(event) => update('date', event.target.value)}
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
          />
          <input
            value={draft.source}
            onChange={(event) => update('source', event.target.value)}
            placeholder="Turo, Getaround, Manual..."
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
          />
          <input
            value={draft.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Notes"
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none sm:col-span-2"
          />
          <button
            type="button"
            onClick={addManual}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Add Revenue
          </button>
          <label className="cursor-pointer rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20">
            Upload Turo CSV
            <input type="file" accept=".csv,text/csv" onChange={importTuroCsv} className="hidden" />
          </label>
          <label className="cursor-pointer rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-center text-sm font-bold text-sky-100 transition hover:bg-sky-400/20">
            Import Generic CSV
            <input type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
          </label>
          {message && <p className="sm:col-span-2 text-sm font-semibold text-emerald-300">{message}</p>}
        </div>
      </div>
    </article>
  );
}

function FinanceInsightBoard({ finance, totalNet, avgRoi, onQueueCommand }) {
  const weakest = finance.reduce((lowest, item) => (!lowest || item.roi < lowest.roi ? item : lowest), null);
  const strongest = finance.reduce((highest, item) => (!highest || item.netProfit > highest.netProfit ? item : highest), null);
  const monthlyDebt = finance.reduce((sum, item) => sum + item.monthlyPayment, 0);
  const debtCoverage = monthlyDebt ? totalNet / monthlyDebt : 0;

  const insights = [
    {
      label: 'Best Performer',
      value: strongest?.vehicle?.name || strongest?.vehicle?.display_name || strongest?.vehicle?.id || 'Unavailable',
      detail: strongest ? `${formatCurrency(strongest.netProfit)} monthly net profit` : 'No vehicles available',
      tone: 'text-emerald-300',
    },
    {
      label: 'Watchlist',
      value: weakest?.vehicle?.name || weakest?.vehicle?.display_name || weakest?.vehicle?.id || 'Unavailable',
      detail: weakest ? `${formatPercent(weakest.roi)} annualized ROI estimate` : 'No vehicles available',
      tone: weakest?.roi < 15 ? 'text-amber-300' : 'text-sky-300',
    },
    {
      label: 'Debt Coverage',
      value: `${debtCoverage.toFixed(1)}x`,
      detail: `${formatCurrency(totalNet)} net against ${formatCurrency(monthlyDebt)} loan payments`,
      tone: debtCoverage < 2 ? 'text-amber-300' : 'text-emerald-300',
    },
  ];

  const actions = [
    ['Generate Owner Report', 'Create a monthly owner finance packet with ROI, equity, and vehicle watchlist', 'HIGH'],
    ['Prepare Lender Snapshot', 'Package fleet equity, debt coverage, and payment exposure for financing review', 'NORMAL'],
    ['Find Margin Leaks', 'Ask AI to identify charging, utilization, or maintenance costs dragging margin', 'HIGH'],
  ];

  return (
    <article className="rounded-lg border border-emerald-400/15 bg-slate-900/85 p-5 shadow-xl shadow-black/15">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Finance Copilot
          </p>
          <h2 className="text-2xl font-black tracking-tight">Owner Decision Brief</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            FleetOS would position this as a paid finance layer: monthly owner reporting, AI margin analysis, and lender-ready snapshots. Current fleet ROI is estimated at <span className="font-black text-emerald-300">{formatPercent(avgRoi)}</span>, with modeled monthly net profit of <span className="font-black text-emerald-300">{formatCurrency(totalNet)}</span>.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {insights.map((insight) => (
              <div key={insight.label} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{insight.label}</p>
                <p className={`mt-2 truncate text-xl font-black ${insight.tone}`}>{insight.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Paid Reporting Actions
          </p>
          <div className="space-y-3">
            {actions.map(([label, detail, priority]) => (
              <button
                key={label}
                type="button"
                onClick={() => onQueueCommand?.(`${label}: ${detail}`, priority)}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-left transition hover:border-sky-400/30 hover:bg-sky-400/10"
              >
                <span className="block text-sm font-black text-slate-100">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PricingAgentPanel({ recommendations = [], summary, marketInputs, onMarketInputsChange, onQueueCommand }) {
  const strongest = summary?.strongest;
  const [draft, setDraft] = useState(() => marketInputs);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const saveMarketInputs = () => {
    window.localStorage.setItem(MARKET_RATE_KEY, JSON.stringify(draft));
    onMarketInputsChange?.(draft);
  };

  return (
    <article className="rounded-lg border border-sky-300/20 bg-slate-900/85 p-5 shadow-xl shadow-black/15">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Turo Pricing Agent
          </p>
          <h2 className="text-2xl font-black tracking-tight">Dynamic Pricing Suggestions</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            FleetOS looks at weather, weekend/holiday demand, Tesla utilization, vehicle health, and imported Turo earnings to suggest price changes with confidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[320px]">
          <Metric
            label="Avg Suggestion"
            value={`${summary.averageChange > 0 ? '+' : ''}${summary.averageChange}%`}
            tone={summary.averageChange >= 0 ? 'text-emerald-300' : 'text-amber-300'}
          />
          <Metric
            label="Top Action"
            value={strongest ? `${strongest.recommendedChange > 0 ? '+' : ''}${strongest.recommendedChange}%` : 'n/a'}
            tone="text-sky-300"
            helper={strongest?.vehicle?.name || strongest?.vehicle?.display_name || strongest?.vehicle?.id}
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Manual Market Inputs</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add local Turo market context without scraping: current daily rate, nearby competitor average, minimum price floor, and target rate.
            </p>
          </div>
          <button
            type="button"
            onClick={saveMarketInputs}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Save Market Inputs
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            ['currentDailyRate', 'Current $/day'],
            ['competitorAverage', 'Market avg $/day'],
            ['minimumDailyRate', 'Minimum $/day'],
            ['targetDailyRate', 'Target $/day'],
          ].map(([field, label]) => (
            <input
              key={field}
              type="number"
              value={draft[field] || ''}
              onChange={(event) => updateDraft(field, event.target.value)}
              placeholder={label}
              className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-sky-300/40"
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {recommendations.slice(0, 3).map((item) => (
          <article key={item.id} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{item.vehicle.name || item.vehicle.display_name || item.vehicle.id}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Confidence {item.confidence}%</p>
              </div>
              <span className={`rounded-md px-3 py-2 text-lg font-black ${item.recommendedChange >= 0 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
                {item.recommendedChange > 0 ? '+' : ''}{item.recommendedChange}%
              </span>
            </div>
            {item.recommendedDailyRate && (
              <p className="mt-3 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-200">
                Suggested rate: {formatCurrency(item.recommendedDailyRate)}/day
              </p>
            )}
            <div className="mt-4 space-y-2">
              {item.signals.slice(0, 4).map((signal) => (
                <div key={`${item.id}-${signal.label}`} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-slate-200">{signal.label}</p>
                    <span className={`text-xs font-black ${signal.impact >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {signal.impact > 0 ? '+' : ''}{signal.impact}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{signal.detail}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onQueueCommand?.(`Review Turo pricing for ${item.vehicle.name || item.vehicle.display_name || item.vehicle.id}: ${item.title} with ${item.confidence}% confidence`, 'HIGH')}
              className="mt-4 w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
            >
              Queue Pricing Review
            </button>
          </article>
        ))}
      </div>
    </article>
  );
}

export default function FleetFinancePanel({ fleet = [], onQueueCommand }) {
  const [revenueRecords, setRevenueRecords] = useState(() => readRevenueRecords());
  const [marketInputs, setMarketInputs] = useState(() => readMarketInputs());

  useEffect(() => {
    const refresh = () => setRevenueRecords(readRevenueRecords());
    syncRevenueFromBackend().then(setRevenueRecords).catch(() => setRevenueRecords(readRevenueRecords()));
    window.addEventListener('fleetos-revenue-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('fleetos-revenue-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const finance = fleet.map((vehicle) => vehicleFinance(vehicle, revenueRecords));
  const totalRevenue = finance.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = finance.reduce((sum, item) => sum + item.operatingCost, 0);
  const totalNet = finance.reduce((sum, item) => sum + item.netProfit, 0);
  const totalEquity = finance.reduce((sum, item) => sum + item.equity, 0);
  const avgRoi = finance.length
    ? finance.reduce((sum, item) => sum + item.roi, 0) / finance.length
    : 0;
  const pricingRecommendations = buildPricingRecommendations({ fleet, revenueRecords, market: marketInputs });
  const pricingSummary = buildFleetPricingSummary(pricingRecommendations);

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

      <RevenueTracker
        fleet={fleet}
        records={revenueRecords}
        onRecordsChanged={() => setRevenueRecords(readRevenueRecords())}
      />

      <PricingAgentPanel
        recommendations={pricingRecommendations}
        summary={pricingSummary}
        marketInputs={marketInputs}
        onMarketInputsChange={setMarketInputs}
        onQueueCommand={onQueueCommand}
      />

      <FinanceInsightBoard
        finance={finance}
        totalNet={totalNet}
        avgRoi={avgRoi}
        onQueueCommand={onQueueCommand}
      />

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
