import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { monument, monumentType } from '../monument/monumentTokens';
import { submitEarlyAccessLead } from '../../services/leadService';

const STORAGE_KEY = 'fleetos.launchNotice.v1';

function readSavedEmail() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return parsed?.email || '';
  } catch {
    return '';
  }
}

function saveSignup(email) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      email,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Storage may be unavailable.
  }
}

export default function MonumentLaunchSignup({ layout = 'card' }) {
  const [email, setEmail] = useState(() => readSavedEmail());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(() => Boolean(readSavedEmail()));
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitEarlyAccessLead({
        email: trimmed,
        plan: 'Launch notice',
        useCase: 'Launch waitlist',
        teslaCount: '1',
      });
      saveSignup(trimmed);
      setDone(true);
    } catch (submitError) {
      setError(submitError.message || 'Could not save your email. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className={`text-center ${monumentType.revealHint}`} style={{ color: monument.money }}>
        You&apos;re on the launch list. We&apos;ll email you when ROBOAGENT goes live.
      </p>
    );
  }

  const shellClass = layout === 'card'
    ? 'rounded-xl px-4 py-3.5'
    : 'pt-1';

  const shellStyle = layout === 'card'
    ? { backgroundColor: monument.ledgerWash }
    : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      className={shellClass}
      style={shellStyle}
    >
      <p className={monumentType.label} style={{ color: monument.inkGhost }}>Launch notice</p>
      <p className={`mt-1.5 ${monumentType.revealHint}`} style={{ color: monument.inkMuted }}>
        Get an email when we leave beta.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 ${monumentType.sheetBody} outline-none transition focus:ring-2`}
          style={{
            borderColor: monument.hairline,
            backgroundColor: monument.surface,
            color: monument.ink,
          }}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting}
          className={`shrink-0 rounded-xl px-3.5 py-2.5 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60`}
          style={{ backgroundColor: monument.action }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Notify me'}
        </button>
      </div>
      {error && (
        <p className={`mt-2 ${monumentType.revealHint}`} style={{ color: monument.projected }} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
