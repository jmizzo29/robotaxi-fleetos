import { useState } from 'react';
import { submitBetaFeedback } from '../services/betaAdminService';

export default function BetaFeedbackForm({ route = 'settings', compact = false }) {
  const [form, setForm] = useState({
    type: 'feedback',
    rating: '5',
    title: '',
    detail: '',
    email: '',
  });
  const [message, setMessage] = useState('');

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

  const inputClass = compact
    ? 'w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm font-medium text-ink'
    : 'w-full rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white';

  const selectClass = compact
    ? 'rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm font-medium text-ink'
    : 'rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white';

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <select value={form.type} onChange={(event) => update('type', event.target.value)} className={selectClass}>
          <option value="feedback">Feedback</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature request</option>
          <option value="confusing">Confusing UX</option>
        </select>
        <select value={form.rating} onChange={(event) => update('rating', event.target.value)} className={selectClass}>
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
        className={inputClass}
      />
      <textarea
        required
        value={form.detail}
        onChange={(event) => update('detail', event.target.value)}
        placeholder="What should we know?"
        rows={compact ? 4 : 5}
        className={inputClass}
      />
      <input
        value={form.email}
        onChange={(event) => update('email', event.target.value)}
        placeholder="Email optional"
        className={inputClass}
      />
      <button
        type="submit"
        className={
          compact
            ? 'w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink/90'
            : 'mt-1 w-full rounded-2xl bg-emerald-400 py-4 text-base font-black text-slate-950 active:bg-emerald-300'
        }
      >
        Send Feedback
      </button>
      {message && (
        <p className={`text-sm font-semibold ${compact ? 'text-status-ready' : 'text-emerald-300'}`}>{message}</p>
      )}
    </form>
  );
}
