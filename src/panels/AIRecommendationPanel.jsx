import { Play, TrendingUp } from 'lucide-react';

export default function AIRecommendationPanel({
  recommendations = [],
  isAnalyzing,
  onExecute,
}) {
  return (
    <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 sm:mb-8 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">AI RECOMMENDATIONS</p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Next best actions</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-black text-slate-300">
          {isAnalyzing ? 'Thinking…' : `${recommendations.length} ready`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {recommendations.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            No fresh recommendations yet. Tap “Ask Agent” or run a sync.
          </div>
        )}
        {recommendations.map((recommendation) => (
          <article
            key={recommendation.id || recommendation.title}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 active:bg-slate-900/60"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-white leading-tight">{recommendation.title}</h3>
              <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-black text-emerald-300">
                {Math.round(recommendation.confidence || 0)}%
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-sky-200">{recommendation.impact}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{recommendation.rationale}</p>

            <button
              type="button"
              onClick={() => onExecute(recommendation.command || recommendation.title, 'HIGH')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-[#172231] active:bg-slate-200"
            >
              <Play className="h-4 w-4" /> {recommendation.actionLabel || 'Execute now'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
