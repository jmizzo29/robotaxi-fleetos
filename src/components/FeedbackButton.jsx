import { useState } from 'react';
import BetaFeedbackForm from './BetaFeedbackForm';

const HIDDEN_ROUTES = new Set([
  'overview',
  'fleet',
  'dispatch',
  'network',
  'map',
  'charging',
  'alerts',
  'ai',
  'health',
  'finance',
  'readiness',
  'integrations',
  'settings',
  'account',
]);

export default function FeedbackButton({ route }) {
  const [open, setOpen] = useState(false);

  if (HIDDEN_ROUTES.has(route)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open feedback form"
        className="fixed right-4 z-40 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur transition active:scale-[0.98] lg:top-4"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/60 p-4 backdrop-blur sm:items-center sm:justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Beta Feedback</p>
                <h2 className="mt-2 text-2xl font-black text-white">Tell us what happened</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-slate-300">X</button>
            </div>
            <BetaFeedbackForm route={route} />
          </div>
        </div>
      )}
    </>
  );
}
