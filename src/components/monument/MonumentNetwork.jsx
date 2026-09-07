import { useMemo, useState } from 'react';
import { useFleetAuthStatus } from '../../auth/FleetAuthContext';
import useNetworkEvents from '../../hooks/useNetworkEvents';
import AccountSheet from './AccountSheet';
import ExploreMarketSheet from './ExploreMarketSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentBottomChrome from './MonumentBottomChrome';
import NetworkMonumentPanel from './NetworkMonumentPanel';
import { monument, monumentType } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import { getAccountSheetPayload, getGrowSheetPayload, isTeslaConnected } from '../../utils/monumentUtils';
import {
  getNetworkConvoy,
  getNetworkFooterLine,
  getNetworkHero,
} from '../../utils/networkMonumentUtils';

function EventList({ convoy }) {
  if (convoy.loading) {
    return (
      <p className={`px-6 pb-4 text-center ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
        Loading public events…
      </p>
    );
  }

  if (!convoy.configured) {
    return (
      <div className="px-6 pb-4" data-testid="network-empty">
        <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
          No public event feed is configured. This tab does not invent concerts, stadium lifts, or demand scores.
        </p>
        {convoy.setupNote && (
          <p className={`mt-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
            {convoy.setupNote}
          </p>
        )}
      </div>
    );
  }

  if (convoy.empty) {
    return (
      <div className="px-6 pb-4" data-testid="network-empty">
        <p className={monumentType.sheetBody} style={{ color: monument.inkMuted }}>
          No upcoming public events in tracked cities for this window.
        </p>
        <p className={`mt-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
          {[convoy.source, convoy.asOfLabel ? `as of ${convoy.asOfLabel}` : null].filter(Boolean).join(' · ')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2" data-testid="network-events">
      <p className={`px-1 pb-2 ${monumentType.revealHint}`} style={{ color: monument.inkGhost }}>
        {convoy.disclaimer}
      </p>
      <ul>
        {convoy.eventList.map((event) => (
          <li
            key={event.id}
            className="border-b py-3"
            style={{ borderColor: monument.hairline }}
          >
            <p className={monumentType.label} style={{ color: monument.inkGhost }}>{event.city}</p>
            <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.ink }}>{event.title}</p>
            <p className={`mt-1 ${monumentType.revealHint}`} style={{ color: monument.inkMuted }}>
              {[event.startLabel, event.venue, event.category].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MonumentNetwork({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  onNavigate = () => {},
  onDisconnect = null,
  embedded = false,
}) {
  const { user } = useFleetAuthStatus();
  const live = useNetworkEvents();
  const [accountOpen, setAccountOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [growCity, setGrowCity] = useState('Tampa');
  const [signingOut, setSigningOut] = useState(false);

  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );

  const convoy = useMemo(() => getNetworkConvoy(fleet, live), [fleet, live]);
  const hero = useMemo(() => getNetworkHero(convoy), [convoy]);
  const footerLine = useMemo(() => getNetworkFooterLine(convoy), [convoy]);
  const growPayload = useMemo(() => getGrowSheetPayload(fleet, growCity), [fleet, growCity]);

  const accountPayload = useMemo(
    () => getAccountSheetPayload({
      userName: user?.fullName || user?.firstName || 'ROBOAGENT Owner',
      fleet,
      realFleet,
      realSyncStatus,
    }),
    [user, fleet, realFleet, realSyncStatus],
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      clearLocalComplianceState();
      try { sessionStorage.clear(); } catch { /* ignore */ }
      await logoutFleetOsAccount().catch(() => {});
      if (window.Clerk?.loaded && typeof window.Clerk.signOut === 'function') {
        await window.Clerk.signOut();
      }
      setAccountOpen(false);
      onNavigate('landing');
      window.location.hash = '#/landing';
      window.location.reload();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas }} data-testid="monument-network">
      <div className="shrink-0 px-6 pb-3 pt-6 text-center">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>{hero.label}</p>
        <p className={`mt-2 ${monumentType.monumentSm}`} style={{ color: monument.action }}>{hero.amount}</p>
        <p className={`mt-2 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{hero.subline}</p>
      </div>

      <NetworkMonumentPanel convoy={convoy} />
      <EventList convoy={convoy} />

      <MonumentActionFooter
        line={footerLine}
        doItLabel="Review watch markets"
        onDoIt={() => {
          setGrowCity('Tampa');
          setExploreOpen(true);
        }}
      />

      {!embedded && (
        <MonumentBottomChrome
          utilityActive="network"
          onNavigate={onNavigate}
          onLongPress={() => setAccountOpen(true)}
        />
      )}

      <ExploreMarketSheet
        open={exploreOpen}
        payload={growPayload}
        onClose={() => setExploreOpen(false)}
        onStagePlan={() => setExploreOpen(false)}
        onCompare={() => setGrowCity(growPayload.compareCity)}
        staging={false}
      />

      <AccountSheet
        open={accountOpen}
        payload={accountPayload}
        onClose={() => setAccountOpen(false)}
        onNavigate={onNavigate}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        teslaConnected={teslaConnected}
        onDisconnectTesla={onDisconnect}
      />
    </div>
  );
}
