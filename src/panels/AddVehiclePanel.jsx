import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import RoboWordmark from '../components/RoboWordmark';
import TeslaConnectMark from '../components/TeslaConnectMark';
import { startTeslaOAuth } from '../services/teslaHealthService';
import { getFleetOsBillingStatus, getFleetOsSession } from '../services/sessionService';
import { getAddVehicleCopy } from '../utils/addVehicleCopy';

export default function AddVehiclePanel({ onNavigate }) {
  const [teslaConnected, setTeslaConnected] = useState(false);
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getFleetOsSession(), getFleetOsBillingStatus()])
      .then(([sessionResult, billingResult]) => {
        if (cancelled) return;
        if (sessionResult.status === 'fulfilled') {
          setTeslaConnected(Boolean(sessionResult.value?.teslaConnected));
        }
        if (billingResult.status === 'fulfilled') {
          setBilling(billingResult.value?.billing || billingResult.value || null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = getAddVehicleCopy({ teslaConnected, billing });

  return (
    <div className="min-h-screen bg-[#1C1D21] text-[#F3F3F1] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-12 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </button>

        <div className="mb-10">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="inline-flex items-center bg-transparent p-0"
            aria-label="ROBOAGENT"
          >
            <RoboWordmark className="text-[1.05rem] tracking-[0.22em]" colorClass="text-white" />
          </button>
        </div>

        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-1.5px] leading-none mb-4">
            {copy.title}
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            {copy.body}
          </p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center text-[#F3F3F1]">
            <TeslaConnectMark className="h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold mb-3">One Tesla account</h3>
          <p className="text-white/65 leading-relaxed">
            {copy.detail}
          </p>
        </div>

        {copy.paywalled ? (
          <div
            className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/8 px-4 py-3 text-sm leading-relaxed text-amber-100/90"
            role="status"
          >
            Extra VINs are over this plan coverage. Re-authorizing Tesla will not bypass the limit.
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => startTeslaOAuth('overview')}
          className="w-full bg-white text-black py-5 rounded-2xl text-lg font-semibold hover:bg-white/90 active:scale-[0.985] transition"
        >
          {copy.cta}
        </button>

        <p className="text-center text-white/50 text-sm mt-8 leading-relaxed">
          {copy.footnote}
        </p>
      </div>
    </div>
  );
}
