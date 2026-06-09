import { Loader2 } from 'lucide-react';

export default function PricingValueSection({ onContinueWithTesla, isTeslaLoading }) {
  return (
    <section className="border-t border-white/10 bg-white/[0.03] py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
        <h2 className="font-brand text-3xl font-bold tracking-tight text-white md:text-4xl">
          Start Free. Scale When You&apos;re Ready.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-white/60 md:text-lg">
          Your first Tesla is included free during beta. Connect your vehicle, view live fleet
          performance, and experience AutoFleeto before paying anything.
        </p>
        <p className="mt-3 text-sm text-white/45">No credit card required.</p>
        <button
          type="button"
          onClick={onContinueWithTesla}
          disabled={isTeslaLoading}
          className="mt-8 rounded-full bg-blue-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-blue-400 active:scale-[0.985] disabled:opacity-60"
        >
          {isTeslaLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Connecting…
            </span>
          ) : (
            'Connect Your Tesla Free'
          )}
        </button>
      </div>
    </section>
  );
}
