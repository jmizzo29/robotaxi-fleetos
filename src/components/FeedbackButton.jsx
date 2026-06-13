import { useState } from 'react';
import { submitBetaFeedback } from '../services/betaAdminService';

export default function FeedbackButton({ route }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'feedback',
    rating: '5',
    title: '',
    detail: '',
    email: '',
  });
  const [message, setMessage] = useState('');

  if (route === 'overview') return null;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage('Sending...');
    try {
      await submitBetaFeedback({ ...form, route });
      setMessage('Feedback sent. Thank you.');
      setForm((current) => ({ ...current, title: '', detail: '' }));
    } catch (error) {
      setMessage(error.message || 'Feedback failed.');
    }
  };

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
          <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Beta Feedback</p>
                <h2 className="mt-2 text-2xl font-black text-white">Tell us what happened</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-slate-300">X</button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select value={form.type} onChange={(event) => update('type', event.target.value)} className="rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white">
                <option value="feedback">Feedback</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature request</option>
                <option value="confusing">Confusing UX</option>
              </select>
              <select value={form.rating} onChange={(event) => update('rating', event.target.value)} className="rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white">
                <option value="5">5 - great</option>
                <option value="4">4 - good</option>
                <option value="3">3 - okay</option>
                <option value="2">2 - rough</option>
                <option value="1">1 - broken</option>
              </select>
            </div>

            <input
              required
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Short title"
              className="mt-3 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white"
            />
            <textarea
              required
              value={form.detail}
              onChange={(event) => update('detail', event.target.value)}
              placeholder="What should we know?"
              rows={5}
              className="mt-3 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white"
            />
            <input
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="Email optional"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white"
            />
            <button type="submit" className="mt-4 w-full rounded-2xl bg-emerald-400 py-4 text-base font-black text-slate-950 active:bg-emerald-300">
              Send Feedback
            </button>
            {message && <p className="mt-3 text-sm font-semibold text-emerald-300">{message}</p>}
          </form>
        </div>
      )}
    </>
  );
}
