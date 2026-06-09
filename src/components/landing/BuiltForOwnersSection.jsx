import { TrendingUp, Wrench, Layers } from 'lucide-react';

const cards = [
  {
    Icon: TrendingUp,
    title: 'Profit Per Vehicle',
    desc: 'See actual profit after charging, maintenance, insurance, and financing costs.',
  },
  {
    Icon: Wrench,
    title: 'Operations On Autopilot',
    desc: 'Monitor charging, utilization, downtime, and maintenance from live Tesla telemetry.',
  },
  {
    Icon: Layers,
    title: 'Scale With Confidence',
    desc: 'Understand which vehicles generate the highest ROI before expanding your fleet.',
  },
];

export default function BuiltForOwnersSection() {
  return (
    <section className="border-t border-white/10 bg-black py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Built for owners</p>
          <h2 className="mt-3 font-brand text-3xl font-bold tracking-tight text-white md:text-4xl">
            Your fleet business, one dashboard
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {cards.map(({ Icon, title, desc }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
