import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { askRoboAgent } from '../services/aiService';

const starterQuestions = [
  'What should I do today to maximize earnings?',
  'How did my last rental perform?',
  'Which Tesla should I raise pricing on this weekend?',
  'What maintenance or cleaning risks need attention?',
];

const actionTone = {
  CRITICAL: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
  HIGH: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
  NORMAL: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
  LOW: 'border-slate-400/20 bg-slate-400/10 text-slate-200',
};

function ConfidenceBar({ value = 0, reasons = [] }) {
  const width = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Confidence</p>
        <p className="text-lg font-black text-white">{width}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-300" style={{ width: `${width}%` }} />
      </div>
      {reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-300">
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceList({ evidence = [] }) {
  if (!evidence.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Evidence Used</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {evidence.map((item) => (
          <div key={`${item.label}-${item.detail}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-black text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentActionCard({ action, onQueue }) {
  const tone = actionTone[action.priority] || actionTone.NORMAL;
  return (
    <article className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">{action.type}</p>
          <h3 className="mt-1 text-[15px] font-black text-white leading-tight">{action.title}</h3>
        </div>
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
          {action.approvalRequired ? 'Approval' : 'Info'}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-6 text-slate-100/90">{action.detail}</p>
      <button
        type="button"
        onClick={() => onQueue?.(action.command || `${action.title}: ${action.detail}`, action.priority || 'AI')}
        className="mt-4 w-full rounded-2xl border border-white/15 bg-black/20 py-3 text-sm font-black text-white active:bg-black/40"
      >
        Queue Action
      </button>
    </article>
  );
}

export default function RoboAgentAskPanel({ onQueueCommand }) {
  const [question, setQuestion] = useState(starterQuestions[0]);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const submit = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setIsAsking(true);
    setError('');
    try {
      setAnswer(await askRoboAgent({ question: trimmed }));
    } catch (askError) {
      setError(askError.message || 'ROBOAGENT could not answer right now.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-sky-300/20 bg-slate-900/85 p-4 shadow-lg shadow-black/10 sm:mb-8 sm:p-6">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-300" />
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">ROBOAGENT • Ask</p>
        </div>
        <h2 className="text-2xl font-black tracking-tight">Ask your fleet agent anything</h2>
        <p className="text-sm leading-6 text-slate-400">
          Real data. Evidence-backed answers. Queue actions for approval.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <label htmlFor="roboagent-question" className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
            Your question
          </label>
          <textarea
            id="roboagent-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-[15px] font-semibold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/50"
            placeholder="Ask about pricing, last rental, charging, maintenance..."
          />
          <button
            type="button"
            disabled={isAsking}
            onClick={submit}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-300 py-3.5 text-base font-black text-slate-950 active:bg-sky-200 disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {isAsking ? 'Thinking...' : 'Ask ROBOAGENT'}
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {starterQuestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300 active:bg-white/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-400/25 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
              {error}
            </div>
          )}

          {!answer && !error && (
            <div className="rounded-lg border border-white/10 bg-slate-950/50 p-5 text-sm leading-6 text-slate-400">
              Ask about a real owner workflow: pricing, last rental performance, charge windows, maintenance risk, cleaning, or today&apos;s fleet brief.
            </div>
          )}

          {answer && (
            <>
              <article className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Agent Answer</p>
                <p className="mt-3 text-[15px] leading-7 text-slate-100">{answer.answer}</p>
                {answer.clarifyingQuestion && (
                  <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
                    {answer.clarifyingQuestion}
                  </p>
                )}
              </article>

              <ConfidenceBar value={answer.confidence} reasons={answer.confidenceReasons || []} />
              <EvidenceList evidence={answer.evidence || []} />

              <div className="grid gap-3">
                {(answer.recommendedActions || []).map((item) => (
                  <AgentActionCard key={item.id || `${item.type}-${item.title}`} action={item} onQueue={onQueueCommand} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
