const planItems = [
  'Raise Orlando pricing +18%',
  'Charge Fleet 2 at 2:15 AM',
  'Check Tampa tire pressure before pickup',
];

export default function DailyPlanSection() {
  return (
    <section className="border-t border-white/10 bg-black py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Daily AI Plan</p>
          <h2 className="mt-3 font-brand text-3xl font-bold tracking-tight text-white md:text-4xl">
            Wake up to a plan — not another dashboard.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 md:text-lg">
            Every morning RoboAgent analyzes live Tesla data and recommends highest-impact actions
            for utilization, charging, maintenance, and profitability.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-5 py-4 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
                  7:04 AM Daily Plan Ready
                </p>
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  Active
                </span>
              </div>
            </div>

            <ul className="divide-y divide-white/5 px-5 md:px-6">
              {planItems.map((item) => (
                <li key={item} className="flex items-start gap-3 py-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] text-white/70">
                    →
                  </span>
                  <span className="text-[15px] leading-snug text-white/85">{item}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 bg-emerald-400/[0.06] px-5 py-4 md:px-6">
              <p className="text-sm font-semibold text-emerald-400">
                Estimated upside: +$284 this weekend
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
