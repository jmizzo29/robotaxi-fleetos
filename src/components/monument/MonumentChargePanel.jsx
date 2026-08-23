import { useEffect, useMemo, useState } from 'react';
import TeslaChargeHistoryList from '../TeslaChargeHistoryList';
import TeslaChargingScopeNotice from '../TeslaChargingScopeNotice';
import { getFleetOsSession } from '../../services/sessionService';
import { getTeslaChargeHistory, isMissingChargingScope } from '../../services/teslaChargingService';
import { monument, monumentType } from './monumentTokens';

export default function MonumentChargePanel({
  realFleet = [],
  teslaConnected = false,
  onRequestChargeCommand,
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [missingScope, setMissingScope] = useState(false);
  const primary = useMemo(
    () => realFleet.find((vehicle) => vehicle?.vin) || realFleet[0] || null,
    [realFleet],
  );

  useEffect(() => {
    if (!teslaConnected || !primary?.vin) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getFleetOsSession().catch(() => null),
      getTeslaChargeHistory(primary.vin),
    ])
      .then(([session, history]) => {
        if (cancelled) return;
        const granted = session?.hasChargingCmds !== false && history?.hasChargingCmds !== false;
        setMissingScope(!granted);
        setSessions(Array.isArray(history?.sessions) ? history.sessions : []);
      })
      .catch((nextError) => {
        if (cancelled) return;
        if (isMissingChargingScope(nextError)) {
          setMissingScope(true);
          setSessions([]);
          return;
        }
        setError(nextError.message || 'Unable to load Tesla charge history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [primary?.vin, teslaConnected]);

  if (!teslaConnected) {
    return (
      <div className="px-5 pb-3">
        <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
          Connect Tesla to load billed charge history.
        </p>
      </div>
    );
  }

  if (missingScope) {
    return (
      <div className="px-5 pb-3">
        <TeslaChargingScopeNotice compact />
      </div>
    );
  }

  const charging = /charg/i.test(primary?.chargingState || '');

  return (
    <div className="px-5 pb-3">
      <TeslaChargeHistoryList
        sessions={sessions.slice(0, 6)}
        loading={loading}
        error={error}
      />

      {primary?.vin && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onRequestChargeCommand?.({
              vin: primary.vin,
              name: primary.name || primary.display_name || 'Tesla',
              action: 'start',
            })}
            className="rounded-full border py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F3F3F1]"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            Start charging
          </button>
          <button
            type="button"
            onClick={() => onRequestChargeCommand?.({
              vin: primary.vin,
              name: primary.name || primary.display_name || 'Tesla',
              action: 'stop',
            })}
            disabled={!charging}
            className="rounded-full border py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F3F3F1] disabled:opacity-40"
            style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
          >
            Stop charging
          </button>
        </div>
      )}

      {primary?.vin && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[80, 90].map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => onRequestChargeCommand?.({
                vin: primary.vin,
                name: primary.name || primary.display_name || 'Tesla',
                action: 'set_limit',
                percent,
              })}
              className="py-2 text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ color: monument.action }}
            >
              Set limit {percent}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
