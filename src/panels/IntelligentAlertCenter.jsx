import { AppCard, AppSection } from '../components/shell';
import { colors, semantic, typography } from '../design/roboagentTokens';

const severityStyles = {
  CRITICAL: { border: 'border-rose-200', bg: semantic.alertBg, title: semantic.alert },
  WARNING: { border: 'border-amber-200', bg: semantic.cautionBg, title: semantic.caution },
  INFO: { border: 'border-sky-200', bg: colors.primaryLight, title: colors.primary },
};

export default function IntelligentAlertCenter({ analysis, isAnalyzing }) {
  const alerts = analysis?.alerts || [];

  return (
    <AppSection
      title="Fleet Alerts"
      tier="primary"
      aria-label="Intelligent alert center"
    >
      <AppCard variant="subdued" className="mb-4">
        <p className={typography.bodyMd}>
          {analysis?.summary || 'ROBOAGENT AI is ranking active operating risks.'}
        </p>
        <p className={`mt-2 ${typography.caption}`}>
          {isAnalyzing ? 'Analyzing…' : `${analysis?.provider || 'AI'} · ${analysis?.model || 'model pending'}`}
        </p>
      </AppCard>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {alerts.length === 0 && (
          <AppCard className="border-emerald-200 bg-emerald-50/80 xl:col-span-3">
            <p className={`${typography.cardTitle} text-emerald-900`}>No prioritized alerts</p>
            <p className="mt-1 text-sm font-medium text-emerald-800/80">
              ROBOAGENT has not detected a high-priority operating risk in the current snapshot.
            </p>
          </AppCard>
        )}

        {alerts.map((alert) => {
          const palette = severityStyles[alert.severity] || severityStyles.INFO;
          return (
            <AppCard
              key={alert.id || `${alert.vehicle}-${alert.title}`}
              className={`${palette.border} ${palette.bg}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className={typography.label} style={{ color: palette.title }}>
                    {alert.severity || 'INFO'} · {alert.vehicle || 'Fleet'}
                  </p>
                  <h3 className={`mt-1 ${typography.cardTitle}`}>{alert.title}</h3>
                </div>
                <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-bold text-slate-700">
                  {Math.round(alert.priorityScore || 0)}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-700">{alert.explanation}</p>
              <p className="mt-3 border-t border-slate-200/80 pt-3 text-sm font-semibold text-slate-900">
                {alert.recommendedAction}
              </p>
            </AppCard>
          );
        })}
      </div>
    </AppSection>
  );
}
