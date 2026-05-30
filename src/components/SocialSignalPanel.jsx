import { useEffect, useMemo, useState } from 'react';
import { fetchTeslaSocialUpdates } from '../services/socialUpdatesService';

const statusStyles = {
  opportunity: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  watch: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  neutral: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
};

function timeAgo(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'recently';
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function metricTotal(metrics = {}) {
  return ['like_count', 'reply_count', 'retweet_count', 'quote_count']
    .reduce((sum, key) => sum + Number(metrics[key] || 0), 0);
}

export default function SocialSignalPanel() {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadUpdates({ keepLoadingState = false } = {}) {
    if (!keepLoadingState) setIsLoading(true);
    setError('');
    try {
      const data = await fetchTeslaSocialUpdates();
      setFeed(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    fetchTeslaSocialUpdates()
      .then((data) => {
        if (isMounted) setFeed(data);
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updates = useMemo(() => feed?.updates || [], [feed]);
  const topTags = useMemo(() => {
    const counts = new Map();
    updates.flatMap((update) => update.tags || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
  }, [updates]);

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Live Market Signal
          </p>
          <h2 className="text-2xl font-black tracking-tight">Tesla Robotaxi / Cybercab Updates from X</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            RoboAgent watches public Tesla Robotaxi and Cybercab updates so owners can follow launch, rollout, policy, and service-area signals faster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
            feed?.configured ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
          }`}>
            {feed?.configured ? 'X API Ready' : 'Demo Feed'}
          </span>
          <button
            type="button"
            onClick={loadUpdates}
            disabled={isLoading}
            className="rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      {(error || feed?.error) && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error || feed.error}
        </div>
      )}

      {!feed?.configured && !isLoading && (
        <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-100">
          Add <span className="font-black">X_BEARER_TOKEN</span> in Vercel to switch this from demo signal to live X search.
        </div>
      )}

      {topTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {topTags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {isLoading && !updates.length ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
            Loading Tesla Robotaxi and Cybercab signal...
          </div>
        ) : updates.map((update) => (
          <div key={update.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-100">{update.authorName}</p>
                <p className="text-xs text-slate-500">@{update.username} - {timeAgo(update.createdAt)}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusStyles[update.sentiment] || statusStyles.neutral}`}>
                {update.sentiment || 'signal'}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-300">{update.text}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>{metricTotal(update.metrics)} public interactions</span>
              {update.url ? (
                <a className="font-black uppercase tracking-[0.16em] text-cyan-300 hover:text-cyan-100" href={update.url} target="_blank" rel="noreferrer">
                  Open on X
                </a>
              ) : (
                <span className="font-black uppercase tracking-[0.16em] text-slate-600">Demo Signal</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
