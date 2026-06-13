import { useState } from 'react';
import BetaFeedbackForm from './BetaFeedbackForm';

export default function FeedbackButton({ route }) {
  const [open, setOpen] = useState(false);

  if (route === 'overview') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open feedback form"
        className="fixed bottom-20 left-4 z-50 flex rounded-full border border-emerald-300/30 bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-2xl shadow-black/30 active:bg-emerald-300 lg:bottom-4 lg:px-5 lg:py-3"
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
