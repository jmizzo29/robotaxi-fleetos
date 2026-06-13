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

const INITIAL_VIEW = {
  longitude: -98.5,
  latitude: 34.5,
  zoom: 3.6,
};

function NetworkSummaryCard({ summary }) {
  return (
    <div className="pointer-events-auto max-w-[19rem] rounded-[1.2rem] border border-white/12 bg-black/80 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Cybercab Network</p>
      <div className="mt-4 space-y-2">
        <p className="text-[1.35rem] font-semibold leading-none text-white">{summary.live} Live Markets</p>
        <p className="text-[1.05rem] font-medium text-white/70">{summary.planned} Planned Markets</p>
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Recommended Expansion</p>
        <p className="mt-1.5 text-[1.15rem] font-semibold text-emerald-300">{summary.recommendedExpansion}</p>
      </div>
    </div>
  );
}

function NetworkFallback() {
  const summary = getCybercabNetworkSummary();

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col bg-black px-4 pb-28 pt-4">
      <NetworkSummaryCard summary={summary} />
      <ul className="mt-6 space-y-3">
        {cybercabMarkets.map((market) => (
          <li
            key={market.id}
            className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-white">{market.city}</p>
              <p className={`text-[12px] font-medium ${getPhaseTextClass(market.phase)}`}>
                {getPhaseLabel(market.phase)}
              </p>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-white/50">{market.notes}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[12px] text-white/35">
        Add <code className="rounded bg-white/10 px-1">VITE_MAPBOX_TOKEN</code> to enable the network map.
      </p>
    </div>
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

export default function NetworkPanel() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const summary = useMemo(() => getCybercabNetworkSummary(), []);

  if (!mapboxToken) {
    return <NetworkFallback />;
  }

  return (
    <div className="relative min-h-screen bg-black pb-24 lg:pb-0">
      <div className="absolute inset-0 bottom-24 lg:bottom-0">
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
                className={`h-4 w-4 rounded-full border-2 border-white/90 ring-4 transition hover:scale-125 ${getPhaseMarkerClass(market.phase)} ${getPhaseRingClass(market.phase)}`}
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
      </div>

      <div className="pointer-events-none relative z-10 p-4">
        <NetworkSummaryCard summary={summary} />
      </div>
    </div>
  );
}
