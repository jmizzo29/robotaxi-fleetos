export function getIntegrationsConvoy(realSyncStatus = null, aiAnalysis = null) {
  const teslaLive = realSyncStatus?.state === 'success';
  const aiReady = Boolean(aiAnalysis?.provider);
  const mapboxLive = Boolean(import.meta.env.VITE_MAPBOX_TOKEN);
  const memoryPlanned = false;

  const connected = [teslaLive, mapboxLive, aiReady, memoryPlanned].filter(Boolean).length;

  return {
    total: 4,
    connected,
    tesla: teslaLive ? 'On' : '—',
    mapbox: mapboxLive ? 'On' : '—',
    ai: aiReady ? 'On' : '—',
    memory: memoryPlanned ? 'On' : '—',
    teslaLive,
    mapboxLive,
    aiReady,
  };
}

export function getIntegrationsHero(convoy) {
  return {
    label: 'INTEGRATIONS',
    amount: `${convoy.connected}/${convoy.total}`,
    subline: 'live connections',
  };
}

export function getIntegrationsFooterLine(convoy) {
  if (convoy.teslaLive) return 'Tesla Fleet API syncing healthy.';
  if (convoy.mapboxLive) return 'Mapbox connected — live map ready.';
  return 'Connect Tesla to unlock fleet integrations.';
}

export function getIntegrationDetail(ckey, convoy) {
  const catalog = {
    tesla: {
      title: 'Tesla Fleet API',
      body: 'Live vehicle telemetry, charging state, GPS, odometer, and readiness.',
      status: convoy.teslaLive ? 'Live' : 'Not connected',
    },
    mapbox: {
      title: 'Mapbox',
      body: 'Operational map layer, markers, demand zones, and charging hubs.',
      status: convoy.mapboxLive ? 'Live' : 'Token required',
    },
    ai: {
      title: 'AI Provider',
      body: 'Fleet analysis and operations brief from configured agent runtime.',
      status: convoy.aiReady ? 'Ready' : 'Pending',
    },
    memory: {
      title: 'Fleet Memory',
      body: 'Historical events, recommendations, and retrieval memory.',
      status: 'Planned',
    },
  };
  return catalog[ckey] || catalog.tesla;
}
