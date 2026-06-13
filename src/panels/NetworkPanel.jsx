import { useMemo, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cybercabMarkets } from '../data/cybercabNetwork';
import {
  getCybercabNetworkSummary,
  getPhaseLabel,
  getPhaseMarkerClass,
  getPhaseRingClass,
  getPhaseTextClass,
} from '../utils/cybercabNetworkUtils';
import {
  getExpansionRecommendation,
  getNetworkOpportunities,
} from '../utils/networkIntelligenceUtils';

const INITIAL_VIEW = {
  longitude: -98.5,
  latitude: 34.5,
  zoom: 3.6,
};

const opportunityToneClasses = {
  primary: 'border-l-[#599CE7]',
  success: 'border-l-emerald-400',
  warning: 'border-l-amber-400',
};

function NetworkHeader() {
  return (
    <header className="mb-3 flex items-center justify-between gap-3">
      <p className="text-[1.05rem] font-bold tracking-[0.04em] text-white">NETWORK</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#599CE7]">Demand intel</p>
    </header>
  );
}

function NetworkMapSection({ mapboxToken, viewState, setViewState, selectedMarket, setSelectedMarket, summary }) {
  if (!mapboxToken) {
    return (
      <section aria-label="Cybercab network map">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Cybercab network map</p>
        <div className="relative h-44 overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#06080c]">
          <div className="absolute inset-0 bg-[#599CE7]/[0.06]" aria-hidden="true" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-3 text-[9px] font-semibold">
            <span className="text-emerald-400">● Live {summary.live}</span>
            <span className="text-[#599CE7]">● Planned {summary.planned}</span>
            <span className="text-amber-300">● Emerging {summary.early}</span>
          </div>
          <p className="absolute bottom-3 left-3 right-3 text-[11px] font-medium text-white/55">
            {summary.total} markets · {summary.recommendedExpansion} recommended
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Cybercab network map">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Cybercab network map</p>
      <div className="relative h-44 overflow-hidden rounded-[1.1rem] border border-white/10">
        <Map
          {...viewState}
          onMove={(event) => setViewState(event.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
          style={{ width: '100%', height: '100%' }}
          onClick={() => setSelectedMarket(null)}
        >
          {cybercabMarkets.map((market) => (
            <Marker
              key={market.id}
              longitude={market.longitude}
              latitude={market.latitude}
              onClick={(event) => {
                event.originalEvent?.stopPropagation?.();
                setSelectedMarket(market);
              }}
            >
              <button
                type="button"
                aria-label={`${market.city} — ${getPhaseLabel(market.phase)}`}
                className={`h-3.5 w-3.5 rounded-full border-2 border-white/90 ring-4 transition hover:scale-125 ${getPhaseMarkerClass(market.phase)} ${getPhaseRingClass(market.phase)}`}
              />
            </Marker>
          ))}

          {selectedMarket && (
            <Popup
              longitude={selectedMarket.longitude}
              latitude={selectedMarket.latitude}
              onClose={() => setSelectedMarket(null)}
              closeButton
              closeOnClick={false}
              anchor="top"
              offset={16}
              className="fleetos-popup"
            >
              <MarketPopup market={selectedMarket} onClose={() => setSelectedMarket(null)} />
            </Popup>
          )}
        </Map>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-3 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[9px] font-semibold backdrop-blur-sm">
          <span className="text-emerald-400">● Live</span>
          <span className="text-[#599CE7]">● Planned</span>
          <span className="text-amber-300">● Emerging</span>
        </div>
      </div>
    </section>
  );
}

function OpportunitiesSection({ opportunities }) {
  return (
    <section className="mt-4" aria-label="Opportunities">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Opportunities</p>
        <span className="text-[11px] font-medium text-[#599CE7]">See all</span>
      </div>
      <ul className="space-y-2">
        {opportunities.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border border-white/10 border-l-[3px] bg-white/[0.03] px-3 py-2.5 ${opportunityToneClasses[item.tone] || opportunityToneClasses.primary}`}
          >
            <p className="text-[13px] font-semibold text-white">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-white/50">{item.place}</p>
            <p className="mt-1.5 text-[12px] font-bold text-[#599CE7]">{item.demandLabel}</p>
            <p className="mt-1 text-[11px] text-white/55">Recommended: {item.recommendation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExpansionSection({ expansion, onNavigate }) {
  return (
    <section className="mt-4" aria-label="Expansion recommendations">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Expansion recommendations</p>
      <div className="rounded-[1rem] border border-emerald-500/25 border-l-[3px] border-l-emerald-400 bg-white/[0.03] p-3.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-400">Recommended expansion</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[1.35rem] font-semibold text-white">{expansion.city}</p>
          <p className="text-[1rem] font-bold text-emerald-400">{expansion.projectedLabel}</p>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-white/55">{expansion.rationale}</p>
        <button
          type="button"
          onClick={() => onNavigate?.('finance')}
          className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-[13px] font-semibold text-white transition active:bg-white/[0.04]"
        >
          View expansion plan →
        </button>
      </div>
    </section>
  );
}

function MarketPopup({ market, onClose }) {
  return (
    <div className="min-w-[220px] rounded-[14px] border border-white/10 bg-[#0a0a0a]/95 p-4 text-white backdrop-blur-md">
      <p className="text-[17px] font-semibold tracking-tight">{market.city}</p>
      <p className={`mt-1 text-[13px] font-medium ${getPhaseTextClass(market.phase)}`}>
        {getPhaseLabel(market.phase)}
      </p>
      <p className="mt-3 text-[13px] leading-snug text-white/55">{market.notes}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 text-[12px] font-medium text-white/45 transition active:text-white"
      >
        Close
      </button>
    </div>
  );
}

export default function NetworkPanel({ fleet = [], onNavigate = () => {} }) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const summary = useMemo(() => getCybercabNetworkSummary(), []);
  const opportunities = useMemo(() => getNetworkOpportunities(fleet), [fleet]);
  const expansion = useMemo(() => getExpansionRecommendation(fleet), [fleet]);

  return (
    <div className="min-h-screen bg-black px-4 pb-28 pt-4 text-white">
      <NetworkHeader />
      <NetworkMapSection
        mapboxToken={mapboxToken}
        viewState={viewState}
        setViewState={setViewState}
        selectedMarket={selectedMarket}
        setSelectedMarket={setSelectedMarket}
        summary={summary}
      />
      <OpportunitiesSection opportunities={opportunities} />
      <ExpansionSection expansion={expansion} onNavigate={onNavigate} />
    </div>
  );
}
