import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import CommandMapPreview from '../home/CommandMapPreview';
import MapDetailSheet from './MapDetailSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentUtilityLinks from './MonumentUtilityLinks';
import { monument } from './monumentTokens';
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
}) {
  const { user } = useUser();
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
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: monument.canvas }}>
      <MonumentHero
        label={hero.label}
        amount={hero.amount}
        subline={hero.subline}
        amountColor="money"
        onTapAmount={() => setMapOpen(true)}
      />

      <CommandMapPreview
        fleet={fleet}
        realFleet={realFleet}
        totalEarnings={totalEarnings}
        syncState={syncState}
        mapHeightClass="h-[148px]"
        bare
      />

      <MonumentActionFooter
        line={footerLine}
        doItLabel="Open map"
        onDoIt={() => setMapOpen(true)}
      />

      <div
        className="shrink-0 touch-manipulation border-t pt-1"
        style={{ borderColor: monument.hairline }}
        onPointerUp={(event) => {
          const started = Number(event.currentTarget.dataset.pressStart || 0);
          if (started && Date.now() - started >= 500) setAccountOpen(true);
          delete event.currentTarget.dataset.pressStart;
        }}
        onPointerDown={(event) => {
          event.currentTarget.dataset.pressStart = String(Date.now());
        }}
      >
        <MonumentUtilityLinks layout="dock" active="map" onNavigate={onNavigate} />
        <p className="pb-1 text-center text-[10.8px] font-medium" style={{ color: monument.inkGhost }}>
          Long-press for Account
        </p>
      </div>

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
