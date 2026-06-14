import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AssetPositionMap from './AssetPositionMap';
import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';
import { getAssetSheetPayload, getFleetMembersByTile } from '../../utils/monumentUtils';

const TILE_LABELS = {
  active: 'Active',
  charging: 'Charge',
  down: 'Down',
};

function LedgerRow({ row }) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b py-2 ${monumentType.ledgerMono}`}
      style={{ borderColor: monument.hairline }}
    >
      <span className="w-11 shrink-0" style={{ color: monument.inkGhost }}>{row.time}</span>
      <span className="w-14 shrink-0 truncate">{row.cab}</span>
      <span className="min-w-0 flex-1 truncate" style={{ color: monument.inkMuted }}>{row.event}</span>
      <span
        className="w-[4.5rem] shrink-0 text-right font-semibold"
        style={{ color: row.tone === 'positive' || row.tone === 'surge' ? monument.money : monument.inkMuted }}
      >
        {row.value}
      </span>
    </div>
  );
}

function FleetMemberPage({ payload, vehicle, onViewTelemetry }) {
  if (!payload) return null;

  return (
    <div className="w-full shrink-0 snap-center snap-always px-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={monumentType.sheetTitle} style={{ color: monument.ink }}>{payload.cab}</h2>
          <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.money }}>
            {payload.statusLine}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[26.4px] font-bold leading-none tabular-nums" style={{ color: monument.money }}>
            {payload.revenue}
          </p>
          <p className={`mt-1 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>today</p>
        </div>
      </div>

      <div className="mt-3.5">
        <AssetPositionMap
          vehicle={vehicle}
          cab={payload.cab}
          positionLabel={payload.positionLabel}
        />
      </div>

      <div
        className={`mt-2.5 rounded-xl px-3 py-3 ${monumentType.monoSm}`}
        style={{ backgroundColor: monument.ledgerWash }}
      >
        {payload.metrics.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 py-0.5">
            <span style={{ color: monument.inkGhost }}>{row.label}</span>
            <span style={{ color: row.positive ? monument.money : monument.ink }}>{row.value}</span>
          </div>
        ))}
      </div>

      <p className={`mt-4 ${monumentType.label}`} style={{ color: monument.inkGhost }}>Today ledger</p>
      <div className="mt-1">
        {payload.rows.map((row) => (
          <LedgerRow key={`${row.time}-${row.event}`} row={row} />
        ))}
      </div>

      {onViewTelemetry && (
        <button
          type="button"
          onClick={() => onViewTelemetry(payload.cab)}
          className={`mt-4 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.action }}
        >
          View telemetry
        </button>
      )}
    </div>
  );
}

export default function FleetBrowseSheet({
  open,
  tileKey = 'active',
  fleet = [],
  realFleet = [],
  totalEarnings = 0,
  syncState = 'idle',
  onClose,
  onViewTelemetry,
}) {
  const pagerRef = useRef(null);
  const scrollRaf = useRef(null);
  const [index, setIndex] = useState(0);

  const members = useMemo(
    () => getFleetMembersByTile(tileKey, fleet, realFleet, totalEarnings, syncState),
    [tileKey, fleet, realFleet, totalEarnings, syncState],
  );

  const payloads = useMemo(
    () => members.map((member) => getAssetSheetPayload(
      fleet,
      realFleet,
      totalEarnings,
      syncState,
      member,
    )),
    [members, fleet, realFleet, totalEarnings, syncState],
  );

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const el = pagerRef.current;
    if (el) el.scrollLeft = 0;
  }, [open, tileKey]);

  const scrollToIndex = useCallback((nextIndex) => {
    const el = pagerRef.current;
    if (!el || members.length === 0) return;
    const clamped = Math.min(members.length - 1, Math.max(0, nextIndex));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setIndex(clamped);
  }, [members.length]);

  const handlePagerScroll = useCallback(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const el = pagerRef.current;
      if (!el || el.clientWidth === 0) return;
      const next = Math.round(el.scrollLeft / el.clientWidth);
      setIndex((current) => (current === next ? current : next));
    });
  }, []);

  if (!open) return null;

  const categoryLabel = TILE_LABELS[tileKey] || 'Fleet';
  const currentCab = members[index]?.cab || '—';

  return (
    <MonumentSheet open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="pb-2">
        <div className="flex items-center justify-between px-[18px] pb-3">
          <button
            type="button"
            onClick={() => scrollToIndex(index - 1)}
            disabled={index <= 0}
            className="rounded-full p-2 disabled:opacity-30"
            aria-label="Previous vehicle"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: monument.ink }} />
          </button>

          <div className="text-center">
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>{categoryLabel}</p>
            <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.ink }}>
              {currentCab}
              <span className="font-normal" style={{ color: monument.inkMuted }}>
                {` · ${index + 1} of ${members.length}`}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index >= members.length - 1}
            className="rounded-full p-2 disabled:opacity-30"
            aria-label="Next vehicle"
          >
            <ChevronRight className="h-5 w-5" style={{ color: monument.ink }} />
          </button>
        </div>

        {members.length === 0 ? (
          <p className={`px-[18px] pb-6 text-center ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
            No vehicles in this group.
          </p>
        ) : (
          <>
            <div
              ref={pagerRef}
              onScroll={handlePagerScroll}
              className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            >
              {members.map((member, memberIndex) => (
                <FleetMemberPage
                  key={member.cab}
                  payload={payloads[memberIndex]}
                  vehicle={member.vehicle}
                  onViewTelemetry={onViewTelemetry}
                />
              ))}
            </div>

            {members.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {members.map((member, dotIndex) => (
                  <button
                    key={member.cab}
                    type="button"
                    onClick={() => scrollToIndex(dotIndex)}
                    aria-label={`View ${member.cab}`}
                    className="rounded-full p-1.5"
                  >
                    <span
                      className="block rounded-full transition-all"
                      style={{
                        width: dotIndex === index ? 6 : 5,
                        height: dotIndex === index ? 6 : 5,
                        backgroundColor: dotIndex === index ? monument.ink : monument.hairline,
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            <p
              className={`mt-3 px-[18px] text-center ${monumentType.revealHint}`}
              style={{ color: monument.inkGhost }}
            >
              Swipe to browse fleet
            </p>
          </>
        )}
      </div>
    </MonumentSheet>
  );
}
