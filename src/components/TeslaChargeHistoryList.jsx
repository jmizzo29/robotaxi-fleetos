import TeslaIndependenceNotice from './TeslaIndependenceNotice';
import TeslaChargingScopeNotice from './TeslaChargingScopeNotice';
import { colors } from '../design/roboagentTokens';
import { formatBilledAmount, formatChargeEnergy, formatChargeTime } from '../utils/teslaChargeHistory';

export default function TeslaChargeHistoryList({
  sessions = [],
  loading = false,
  missingScope = false,
  error = null,
}) {
  if (missingScope) {
    return <TeslaChargingScopeNotice />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#C6C8CE]">Recent sessions</p>
          <p className="mt-1 text-[15px] font-medium text-[#F7F7F5]">Billed charging from Tesla</p>
        </div>
        {loading && <p className="text-[12px] text-[#C6C8CE]">Loading…</p>}
      </div>

      {error && !missingScope && (
        <p className="text-[13px] text-[#C45C4A]">{error}</p>
      )}

      {!loading && sessions.length === 0 && !error && (
        <p className="text-[13px] text-[#C6C8CE]">No Tesla charge sessions returned for the last 90 days.</p>
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-[10px] border px-4 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#F7F7F5]">
                  {session.locationName || 'Charging session'}
                </p>
                <p className="mt-1 text-[12px] text-[#C6C8CE]">{formatChargeTime(session.startedAt || session.endedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-[#F7F7F5]">{formatChargeEnergy(session.energyKwh)}</p>
                <p className="mt-1 text-[12px] text-[#5ED4C8]">{formatBilledAmount(session.billedAmount, session.currency)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TeslaIndependenceNotice compact />
    </div>
  );
}
