import { startTeslaOAuth } from '../services/teslaHealthService';
import { MISSING_CHARGING_SCOPE_MESSAGE } from '../services/teslaChargingService';
import { colors } from '../design/roboagentTokens';

export default function TeslaChargingScopeNotice({ compact = false }) {
  return (
    <div
      className={`rounded-[10px] border px-4 ${compact ? 'py-3' : 'py-4'}`}
      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      role="status"
    >
      <p className="text-[13px] leading-5 text-[#F3F3F1]">{MISSING_CHARGING_SCOPE_MESSAGE}</p>
      <button
        type="button"
        onClick={() => startTeslaOAuth('charging')}
        className="mt-3 w-full rounded-full bg-white py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E0F12] transition hover:bg-white/90"
      >
        Connect Tesla again
      </button>
    </div>
  );
}
