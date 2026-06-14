import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import ExploreMarketSheet from './ExploreMarketSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentUtilityLinks from './MonumentUtilityLinks';
import NetworkMonumentPanel from './NetworkMonumentPanel';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import { monument } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import { getAccountSheetPayload, getGrowSheetPayload, isTeslaConnected } from '../../utils/monumentUtils';
import {
  getNetworkConvoy,
  getNetworkEventRows,
  getNetworkFooterLine,
  getNetworkHero,
} from '../../utils/networkMonumentUtils';

export default function MonumentNetwork({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  onNavigate = () => {},
  onDisconnect = null,
}) {
  const { user } = useUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [staging, setStaging] = useState(false);
  const [growCity, setGrowCity] = useState('Tampa');
  const [signingOut, setSigningOut] = useState(false);

  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );

  const convoy = useMemo(() => getNetworkConvoy(fleet), [fleet]);
  const hero = useMemo(() => getNetworkHero(convoy), [convoy]);
  const eventRows = useMemo(() => getNetworkEventRows(fleet), [fleet]);
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
        amountColor="action"
      />

      <NetworkMonumentPanel
        convoy={convoy}
        onSelectTile={(key) => {
          if (key === 'tampa') {
            setGrowCity('Tampa');
            setExploreOpen(true);
          }
        }}
      />

      <OperationsLedgerStrip rows={eventRows} />

      <MonumentActionFooter
        line={footerLine}
        doItLabel="Explore Tampa"
        onDoIt={() => {
          setGrowCity('Tampa');
          setExploreOpen(true);
        }}
      />

      <div
        className="shrink-0 touch-manipulation border-t pt-1"
        style={{ borderColor: monument.hairline }}
        onPointerDown={(event) => {
          event.currentTarget.dataset.pressStart = String(Date.now());
        }}
        onPointerUp={(event) => {
          const started = Number(event.currentTarget.dataset.pressStart || 0);
          if (started && Date.now() - started >= 500) setAccountOpen(true);
          delete event.currentTarget.dataset.pressStart;
        }}
      >
        <MonumentUtilityLinks layout="dock" active="network" onNavigate={onNavigate} />
        <p className="pb-1 text-center text-[10.8px] font-medium" style={{ color: monument.inkGhost }}>
          Long-press for Account
        </p>
        <div className="lg:hidden min-h-[4.5rem] shrink-0" aria-hidden="true" />
      </div>

      <ExploreMarketSheet
        open={exploreOpen}
        payload={growPayload}
        onClose={() => setExploreOpen(false)}
        onStagePlan={() => setExploreOpen(false)}
        onCompare={() => setGrowCity(growPayload.compareCity)}
        staging={staging}
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
