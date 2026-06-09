export default function PricingValueSection({ onContinueWithTesla, isTeslaLoading }) {
  return (
    <section className="border-t border-white/10 bg-white/[0.03] py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
        <p className="text-lg leading-relaxed text-white/70 md:text-xl">
          One robotaxi can generate hundreds of dollars per day.
          AutoFleeto helps maximize that opportunity.
        </p>
        <button
          type="button"
          onClick={onContinueWithTesla}
          disabled={isTeslaLoading}
          className="mt-8 rounded-full bg-blue-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-blue-400 active:scale-[0.985] disabled:opacity-60"
        >
          {isTeslaLoading ? 'Connecting…' : 'Continue with Tesla'}
        </button>
      </div>
    </section>
  );
}
