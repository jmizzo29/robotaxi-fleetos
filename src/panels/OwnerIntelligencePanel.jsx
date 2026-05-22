import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildOwnerRecommendations, getOwnerIntelligence } from '../services/ownerIntelligenceService';

const tones = {
  emerald: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  sky: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  amber: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
  rose: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
};

function formatNumber(value, suffix = '') {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  return `${Math.round(Number(value)).toLocaleString()}${suffix}`;
}

function DataCard({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
      {detail && <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>}
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <article className={`rounded-lg border p-4 ${tones[recommendation.tone] || tones.sky}`}>
      <p className="text-sm font-black">{recommendation.title}</p>
      <p className="mt-2 text-xs leading-5 opacity-80">{recommendation.detail}</p>
    </article>
  );
}

export default function OwnerIntelligencePanel({ vehicle }) {
  const [intelligence, setIntelligence] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const refresh = useCallback(async () => {
    setStatus({ state: 'loading', message: 'Checking free owner data sources...' });
    try {
      setIntelligence(await getOwnerIntelligence(vehicle));
      setStatus({ state: 'success', message: 'Owner intelligence refreshed.' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'Owner intelligence is unavailable.' });
    }
  }, [vehicle]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  const recommendations = useMemo(() => buildOwnerRecommendations({
    vehicle,
    weather: intelligence?.weather,
    airQuality: intelligence?.airQuality,
    vin: intelligence?.vin,
  }), [intelligence, vehicle]);

  const vinLabel = intelligence?.vin?.model
    ? `${intelligence.vin.modelYear || ''} ${intelligence.vin.make || ''} ${intelligence.vin.model}`.trim()
    : 'Unavailable';

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Owner Intelligence
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">Free Data Layer</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Combines free weather, air quality, and NHTSA VIN data with Tesla telemetry to explain what matters for owners and renters.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={status.state === 'loading'}
          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-wait disabled:opacity-60"
        >
          {status.state === 'loading' ? 'Checking...' : 'Refresh Free APIs'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DataCard
          label="Weather"
          value={formatNumber(intelligence?.weather?.temperature, '°F')}
          detail={`${formatNumber(intelligence?.weather?.windSpeed, ' mph')} wind`}
        />
        <DataCard
          label="Rain Risk"
          value={formatNumber(intelligence?.weather?.precipitationProbability, '%')}
          detail="Highest near-term probability"
        />
        <DataCard
          label="Air Quality"
          value={formatNumber(intelligence?.airQuality?.usAqi)}
          detail={`${formatNumber(intelligence?.airQuality?.pm25)} PM2.5`}
        />
        <DataCard
          label="VIN Decode"
          value={vinLabel}
          detail={intelligence?.vin?.bodyClass || 'NHTSA vPIC public data'}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.title} recommendation={recommendation} />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-3 text-xs leading-5 text-slate-500">
        Sources: Open-Meteo weather, Open-Meteo air quality, and NHTSA vPIC VIN decoder. These are free/no-key integrations in this build.
        {intelligence?.errors?.length > 0 && (
          <span className="block pt-2 text-amber-300">
            Partial data: {intelligence.errors.join(' | ')}
          </span>
        )}
      </div>
    </article>
  );
}
