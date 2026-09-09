import TeslaSyncHealthPanel from './TeslaSyncHealthPanel';
import DataPrivacyPanel from './DataPrivacyPanel';
import BetaFeedbackForm from '../components/BetaFeedbackForm';
import { AppCard, AppSection } from '../components/shell';
import { colors, typography } from '../design/roboagentTokens';

export default function SettingsPanel({
  realSyncStatus,
  vehicle,
  isLoadingReal,
  onSync,
  aiAnalysis,
  replayMode,
  setReplayMode,
}) {
  return (
    <AppSection title="Settings" tier="primary" aria-label="Fleet settings">
      <div className="space-y-4">
        <TeslaSyncHealthPanel
          vehicle={vehicle}
          realSyncStatus={realSyncStatus}
          isLoading={isLoadingReal}
          onSync={onSync}
        />

        <DataPrivacyPanel />

        <AppCard>
          <p className={typography.label}>Product Feedback</p>
          <h2 className={`mt-1 ${typography.cardTitle}`}>Beta Feedback</h2>
          <p className={`mt-2 text-sm font-medium ${typography.muted}`}>
            Report bugs, confusing flows, or feature ideas.
          </p>
          <div className="mt-5">
            <BetaFeedbackForm route="settings" />
          </div>
        </AppCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AppCard>
            <p className={typography.label}>Tesla Integration</p>
            <h2 className={`mt-1 ${typography.cardTitle}`}>Telemetry Sync</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className={`font-medium ${typography.muted}`}>Status</span>
                <span className="font-bold text-[#F7F7F5]">{realSyncStatus?.state || 'idle'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={`font-medium ${typography.muted}`}>Last Message</span>
                <span className="max-w-[60%] text-right font-bold text-[#F7F7F5]">{realSyncStatus?.message || 'Unavailable'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onSync}
              disabled={isLoadingReal}
              className="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {isLoadingReal ? 'Syncing Tesla…' : 'Sync Tesla Telemetry'}
            </button>
          </AppCard>

          <AppCard>
            <p className={typography.label}>AI Runtime</p>
            <h2 className={`mt-1 ${typography.cardTitle}`}>Agent Configuration</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className={`font-medium ${typography.muted}`}>Provider</span>
                <span className="font-bold text-[#F7F7F5]">{aiAnalysis?.provider || 'pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-medium ${typography.muted}`}>Model</span>
                <span className="font-bold text-[#F7F7F5]">{aiAnalysis?.model || 'pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-medium ${typography.muted}`}>Replay Engine</span>
                <button
                  type="button"
                  onClick={() => setReplayMode?.(!replayMode)}
                  className="font-bold"
                  style={{ color: colors.primary }}
                >
                  {replayMode ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </AppSection>
  );
}
