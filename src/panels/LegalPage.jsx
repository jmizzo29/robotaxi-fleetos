import TeslaDataAccessDisclosure from '../components/TeslaDataAccessDisclosure';

const legalCopy = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'RoboAgent Privacy Notice',
    sections: [
      ['What RoboAgent collects', 'When you connect Tesla, RoboAgent may process VIN, precise vehicle location, battery, odometer, charging state, vehicle state, tire/health signals when available, software version, asset records, revenue records, and app usage events.'],
      ['Why it is used', 'RoboAgent uses this data to show telemetry, owner finance, parking history, location intelligence, AI recommendations, and beta diagnostics.'],
      ['Storage', 'RoboAgent stores important beta records in Postgres-backed backend endpoints. Browser storage is limited to local consent and session preferences.'],
      ['Sharing', 'RoboAgent does not sell Tesla telemetry. Free third-party APIs may receive location or VIN only when features such as weather, air quality, reverse geocoding, or VIN decode are used.'],
      ['Deletion', 'Beta users can delete RoboAgent backend data from Settings. Tesla access can be revoked from Tesla account/app third-party access controls.'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'RoboAgent Beta Terms',
    sections: [
      ['Beta software', 'RoboAgent is in beta and may be inaccurate, unavailable, incomplete, or delayed. Do not rely on it for emergency, safety, security, or autonomous-driving decisions.'],
      ['Tesla boundary', 'RoboAgent is not affiliated with or endorsed by Tesla. Tesla controls vehicle access, API availability, autonomous driving eligibility, and command execution.'],
      ['User responsibility', 'The owner remains responsible for vehicle operation, rental decisions, charging, maintenance, insurance, taxes, and compliance with platform rules.'],
      ['Consent', 'By connecting Tesla, you authorize RoboAgent to process telemetry needed to provide the beta service. You may revoke access and request deletion.'],
      ['No warranty', 'RoboAgent is provided as-is during beta with no guarantee of revenue, savings, uptime, or data accuracy.'],
    ],
  },
};

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
