export default function IndustryPositioningSection({ onConnect, connectLabel, connectDisabled = false, connectButtonClass }) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6 md:px-8">
        <h2 className="text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
          Tesla Manages Vehicles.
          <span className="mt-2 block text-white/75">ROBOAGENT Manages Ownership.</span>
        </h2>
        <p className="mt-6 text-base leading-relaxed text-white/50 sm:text-lg md:text-xl">
          Operate your fleet. Protect your assets. Grow your business.
        </p>
        {onConnect && (
          <button
            type="button"
            onClick={onConnect}
            disabled={connectDisabled}
            className={`mt-8 w-full sm:w-auto sm:min-w-[220px] ${connectButtonClass}`}
          >
            {connectLabel}
          </button>
        )}
      </div>
    </section>
  );
}
