export function getSettingsHero(realSyncStatus = null) {
  const state = realSyncStatus?.state ?? 'idle';
  let amount = 'Healthy';
  let subline = 'Tesla sync · Orlando';

  if (state === 'loading') {
    amount = 'Syncing';
    subline = 'refreshing telemetry';
  } else if (state === 'error') {
    amount = 'Attention';
    subline = 'sync needs review';
  } else if (state !== 'success') {
    amount = 'Setup';
    subline = 'connect Tesla to begin';
  }

  return {
    label: 'SETTINGS',
    amount,
    subline,
    healthy: amount === 'Healthy',
  };
}

export function getSettingsRows(realSyncStatus = null, aiAnalysis = null) {
  const syncState = realSyncStatus?.state ?? 'idle';
  const syncValue = syncState === 'success' ? 'Connected' : syncState === 'loading' ? 'Syncing' : 'Setup';

  return [
    { cab: 'Program', event: 'ROBOAGENT beta', value: 'Active', tone: 'neutral' },
    { cab: 'Tesla', event: 'Fleet connection', value: syncValue, tone: syncState === 'success' ? 'positive' : 'alert' },
    { cab: 'Privacy', event: 'Beta consent', value: 'OK', tone: 'positive' },
    { cab: 'Feedback', event: 'Beta form', value: 'Open', tone: 'neutral' },
    {
      cab: 'AI',
      event: aiAnalysis?.provider || 'Runtime',
      value: aiAnalysis?.model ? 'Ready' : 'Pending',
      tone: aiAnalysis?.provider ? 'positive' : 'neutral',
    },
  ];
}

export function getSettingsFooterLine(realSyncStatus = null) {
  const message = realSyncStatus?.message;
  if (message && realSyncStatus?.state === 'success') {
    return message.endsWith('.') ? message : `${message}.`;
  }
  if (realSyncStatus?.state === 'success') return 'Last sync completed recently.';
  return 'Connect and sync Tesla to unlock fleet settings.';
}
