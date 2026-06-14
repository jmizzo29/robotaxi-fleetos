import LandingHeader from './LandingHeader';
import { monument, monumentType } from '../monument/monumentTokens';
import { legalCopy } from '../../utils/legalCopy';

function SectionCard({ title, body }) {
  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{ borderColor: monument.hairline, backgroundColor: monument.surface }}
    >
      <p className={`${monumentType.sheetBody} font-semibold`} style={{ color: monument.ink }}>
        {title}
      </p>
      <p className={`mt-2 ${monumentType.revealHint} leading-relaxed`} style={{ color: monument.inkMuted }}>
        {body}
      </p>
    </div>
  );
}

function DataRow({ left, right }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b py-2 ${monumentType.monoSm}`}
      style={{ borderColor: monument.hairline }}
    >
      <span style={{ color: monument.inkGhost }}>{left}</span>
      <span className="text-right font-semibold" style={{ color: monument.money }}>{right}</span>
    </div>
  );
}

export default function LegalMonument({ type = 'privacy', onNavigate }) {
  const content = legalCopy[type] || legalCopy.privacy;

  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ backgroundColor: monument.canvas }}>
      <LandingHeader onNavigate={onNavigate} variant="monument" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="shrink-0 pb-4 text-center">
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>{content.eyebrow}</p>
          <h1 className={`mt-3 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>
            {content.title}
          </h1>
          <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
            {content.subtitle}
          </p>
          <p className={`mt-3 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
            Draft beta language — have counsel review before launch.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
          {type === 'privacy' && content.dataRows?.length > 0 && (
            <div
              className="rounded-xl px-4 py-3.5"
              style={{ backgroundColor: monument.ledgerWash }}
            >
              <p className={monumentType.label} style={{ color: monument.inkGhost }}>Data access</p>
              <div className="mt-2">
                {content.dataRows.map(([left, right]) => (
                  <DataRow key={left} left={left} right={right} />
                ))}
              </div>
            </div>
          )}

          {content.sections.map(([title, body]) => (
            <SectionCard key={title} title={title} body={body} />
          ))}
        </div>

        <div className="shrink-0 space-y-2 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className={`w-full py-2.5 ${monumentType.actionLink}`}
            style={{ color: monument.action }}
          >
            Back to About
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`w-full py-2.5 ${monumentType.actionLink}`}
            style={{ color: monument.inkMuted }}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
