export default function AIRecommendationPanel({
  recommendations = [],
  isAnalyzing,
  onExecute,
}) {
  return (
    <section className="mb-8 rounded-lg border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            AI Recommendations
          </p>
          <h2 className="text-2xl font-black tracking-tight">Operator Next Best Actions</h2>
        </div>
        <span className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300">
          {isAnalyzing ? 'Refreshing' : `${recommendations.length} actions`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <article
            key={recommendation.id || recommendation.title}
            className="rounded-lg border border-white/10 bg-slate-950/50 p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-lg font-black text-slate-50">{recommendation.title}</h3>
              <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-black text-emerald-200">
                {Math.round(recommendation.confidence || 0)}%
              </span>
            </div>

            <p className="text-sm font-semibold text-sky-200">{recommendation.impact}</p>
            <p className="mt-3 text-sm text-slate-400">{recommendation.rationale}</p>

            <button
              type="button"
              onClick={() => onExecute(recommendation.command || recommendation.title, 'AI')}
              className="mt-5 w-full rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
            >
              {recommendation.actionLabel || 'Execute'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
