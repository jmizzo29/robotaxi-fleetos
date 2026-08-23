import { useMemo, useState } from 'react';
import { useFleetAuthStatus } from '../../auth/FleetAuthContext';
import AccountSheet from './AccountSheet';
import CommandMapPreview from '../home/CommandMapPreview';
import MapDetailSheet from './MapDetailSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentBottomChrome from './MonumentBottomChrome';
import { monument, monumentType } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import { getAccountSheetPayload, isTeslaConnected } from '../../utils/monumentUtils';
import { getMapFooterLine, getMapMonumentHero } from '../../utils/mapMonumentUtils';

export default function MonumentMap({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  onNavigate = () => {},
  onDisconnect = null,
  embedded = false,
}) {
  const { user } = useFleetAuthStatus();
  const [mapOpen, setMapOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const syncState = isLoadingReal ? 'loading' : (realSyncStatus?.state ?? 'idle');
  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );
  const totalEarnings = realFleet.reduce((sum, vehicle) => sum + (Number(vehicle.revenue) || 0), 0);

  const hero = useMemo(
    () => getMapMonumentHero(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

  const footerLine = useMemo(
    () => getMapFooterLine(fleet, realFleet, totalEarnings, syncState),
    [fleet, realFleet, totalEarnings, syncState],
  );

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
      try { sessionStorage.clear(); } catch {}
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
    <div className="relative flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas }}>
      <div className="relative min-h-0 flex-1">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          totalEarnings={totalEarnings}
          syncState={syncState}
          mapHeightClass="h-full min-h-[280px]"
          bare
          flush
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#1C1D21] via-[#1C1D21]/55 to-transparent px-6 pb-16 pt-8 text-center">
          <p className={monumentType.label} style={{ color: monument.inkGhost }}>{hero.label}</p>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className={`pointer-events-auto mt-4 ${monumentType.monument}`}
            style={{ color: monument.ink }}
          >
            {hero.amount}
          </button>
          <p className={`mt-3 ${monumentType.subline}`} style={{ color: monument.inkMuted }}>{hero.subline}</p>
        </div>
      </div>

      <div className="relative z-10" style={{ backgroundColor: monument.canvas }}>
        <MonumentActionFooter
          line={footerLine}
          doItLabel="Open map"
          onDoIt={() => setMapOpen(true)}
        />
      </div>

      {!embedded && (
      <MonumentBottomChrome
        utilityActive="map"
        onNavigate={onNavigate}
        onLongPress={() => setAccountOpen(true)}
      />
      )}

      <MapDetailSheet
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        fleet={fleet}
        realFleet={realFleet}
        totalEarnings={totalEarnings}
        syncState={syncState}
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
