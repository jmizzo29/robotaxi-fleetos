import { DollarSign, HeartPulse, MapPin, Compass } from 'lucide-react';

const cards = [
  {
    Icon: DollarSign,
    title: 'How much money did I make?',
    desc: 'Track revenue, trips, and fleet performance.',
  },
  {
    Icon: HeartPulse,
    title: 'Are my assets healthy?',
    desc: 'Monitor vehicle availability, charging, and issues.',
  },
  {
    Icon: MapPin,
    title: 'Where are my vehicles?',
    desc: 'View your fleet in real time.',
  },
  {
    Icon: Compass,
    title: 'Where should I grow next?',
    desc: 'Discover demand opportunities and expansion zones.',
  },
];

export default function BuiltForOwnersSection() {
  return (
    <section className="border-t border-white/10 bg-black py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-3xl md:text-4xl">
            Every Day, Owners Need Answers
          </h2>
        </div>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:gap-5">
          {cards.map(({ Icon, title, desc }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 sm:p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
                {title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/55">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
