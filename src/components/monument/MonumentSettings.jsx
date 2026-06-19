import { useMemo, useState } from 'react';
import { useFleetAuthStatus } from '../../auth/FleetAuthContext';
import AccountSheet from './AccountSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentBottomChrome from './MonumentBottomChrome';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import { monument } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import { getAccountSheetPayload, isTeslaConnected } from '../../utils/monumentUtils';
import {
  getSettingsFooterLine,
  getSettingsHero,
  getSettingsRows,
} from '../../utils/settingsMonumentUtils';

export default function MonumentSettings({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  onNavigate = () => {},
  onDisconnect = null,
  embedded = false,
}) {
  const { user } = useFleetAuthStatus();
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );

  const hero = useMemo(() => getSettingsHero(realFleet), [realFleet]);
  const rows = useMemo(() => getSettingsRows(realFleet), [realFleet]);
  const footerLine = useMemo(() => getSettingsFooterLine(), []);

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
        amountColor={hero.healthy ? 'money' : 'projected'}
      />

      <OperationsLedgerStrip rows={rows} />

      <MonumentActionFooter
        line={footerLine}
        doItLabel="Privacy"
        onDoIt={() => onNavigate('privacy')}
        secondaryLabel="Terms"
        onSecondary={() => onNavigate('terms')}
      />

      {!embedded && (
      <MonumentBottomChrome
        utilityActive="settings"
        onNavigate={onNavigate}
        onLongPress={() => setAccountOpen(true)}
      />
      )}

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
