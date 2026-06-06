import { useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { askRoboAgent } from '../services/aiService';
import { Button, Card, Chip, StatusDot } from '../ui';

const starterQuestions = [
  'What should I do today?',
  'Raise pricing this weekend?',
  'Charging plan for tonight?',
  'Any maintenance risks?',
];

const priorityTone = {
  CRITICAL: 'critical',
  HIGH: 'caution',
  NORMAL: 'active',
  LOW: 'ready',
};

function MessageBubble({ role, children }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${
          isUser
            ? 'bg-accent text-white'
            : 'border border-ink/10 bg-surface-raised text-ink'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ActionCard({ action, onQueue }) {
  const tone = priorityTone[action.priority] || 'active';
  return (
    <Card padding="p-4" className="border-l-4 border-l-status-active">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-muted">{action.type}</p>
          <h3 className="mt-0.5 text-sm font-semibold text-ink">{action.title}</h3>
        </div>
        <StatusDot tone={tone} />
      </div>
      <p className="mt-2 text-sm text-ink-muted">{action.detail}</p>
      {action.approvalRequired && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full sm:w-auto"
          onClick={() => onQueue?.(action.command || `${action.title}: ${action.detail}`, action.priority || 'AI')}
        >
          Approve action
        </Button>
      )}
    </Card>
  );
}

export default function RoboAgentAskPanel({ onQueueCommand }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [error, setError] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const inputRef = useRef(null);

  const submit = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || isAsking) return;
    setIsAsking(true);
    setError('');
    setLastQuestion(trimmed);
    setQuestion('');
    try {
      setAnswer(await askRoboAgent({ question: trimmed }));
    } catch (askError) {
      setError(askError.message || 'Agent is unavailable right now.');
      setAnswer(null);
    } finally {
      setIsAsking(false);
      inputRef.current?.focus();
    }
  };

  return (
    <section className="animate-fade-up">
      <Card className="flex min-h-[min(72vh,640px)] flex-col overflow-hidden p-0">
        <div className="border-b border-ink/10 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-ready/10 text-status-ready">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Fleet Agent</h2>
              <p className="text-xs text-ink-muted">Evidence-backed answers. Approve actions in one tap.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {!lastQuestion && !error && (
            <Card padding="p-4" className="bg-surface text-center">
              <p className="text-sm text-ink-muted">
                Ask anything about pricing, charging, maintenance, or today&apos;s fleet plan.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {starterQuestions.map((prompt) => (
                  <Chip key={prompt} onClick={() => submit(prompt)}>
                    {prompt}
                  </Chip>
                ))}
              </div>
            </Card>
          )}

          {lastQuestion && <MessageBubble role="user">{lastQuestion}</MessageBubble>}

          {isAsking && (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <StatusDot tone="active" pulse />
              Thinking…
            </div>
          )}

          {error && (
            <Card padding="p-4" className="border-status-critical/20 bg-status-critical/5 text-sm text-status-critical">
              {error}
            </Card>
          )}

          {answer && (
            <>
              <MessageBubble role="agent">{answer.answer}</MessageBubble>

              {answer.clarifyingQuestion && (
                <Card padding="p-3" className="border-status-caution/20 bg-status-caution/5 text-sm text-ink">
                  {answer.clarifyingQuestion}
                </Card>
              )}

              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span>Confidence {Math.round(answer.confidence || 0)}%</span>
                {(answer.confidenceReasons || []).slice(0, 3).map((reason) => (
                  <Chip key={reason}>{reason}</Chip>
                ))}
              </div>

              {(answer.recommendedActions || []).map((item) => (
                <ActionCard
                  key={item.id || `${item.type}-${item.title}`}
                  action={item}
                  onQueue={onQueueCommand}
                />
              ))}
            </>
          )}
        </div>

        <div className="border-t border-ink/10 bg-surface-raised p-3 sm:p-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="roboagent-question" className="sr-only">
              Ask your fleet agent
            </label>
            <textarea
              id="roboagent-question"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Ask about your fleet…"
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-ink/12 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-status-active/40"
            />
            <Button
              size="md"
              disabled={isAsking || !question.trim()}
              className="h-11 w-11 shrink-0 rounded-full p-0"
              aria-label="Send question"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </section>
  );
}
