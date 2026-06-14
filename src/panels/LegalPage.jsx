import TeslaDataAccessDisclosure from '../components/TeslaDataAccessDisclosure';
import { legalCopy } from '../utils/legalCopy';

export default function LegalPage({ type = 'privacy' }) {
  const content = legalCopy[type] || legalCopy.privacy;

  return (
    <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">{content.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{content.title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Draft beta language for early testing. Have a qualified attorney review before public launch or paid subscriptions.
      </p>

      <div className="mt-8 space-y-4">
        {type === 'privacy' && <TeslaDataAccessDisclosure compact />}
        {content.sections.map(([title, detail]) => (
          <article key={title} className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
            <h2 className="text-lg font-black text-slate-100">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
