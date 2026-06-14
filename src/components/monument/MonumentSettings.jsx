import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentBottomChrome from './MonumentBottomChrome';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import { monument } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import useMonumentTeslaDisconnect from '../../hooks/useMonumentTeslaDisconnect';
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
  aiAnalysis = null,
  isLoadingReal = false,
  onSync = () => {},
  onNavigate = () => {},
  onDisconnect = null,
}) {
  const { user } = useUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );
  const {
    confirmOpen,
    setConfirmOpen,
    disconnecting,
    confirmPayload,
    requestDisconnect,
    handleConfirm,
  } = useMonumentTeslaDisconnect(onDisconnect);

  const hero = useMemo(() => getSettingsHero(realSyncStatus), [realSyncStatus]);
  const rows = useMemo(() => getSettingsRows(realSyncStatus, aiAnalysis), [realSyncStatus, aiAnalysis]);
  const footerLine = useMemo(() => getSettingsFooterLine(realSyncStatus), [realSyncStatus]);

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
        doItLabel={isLoadingReal ? 'Syncing…' : 'Sync Tesla'}
        onDoIt={onSync}
        secondaryLabel={teslaConnected ? 'Disconnect Tesla' : null}
        onSecondary={teslaConnected ? requestDisconnect : undefined}
      />

      <MonumentBottomChrome
        utilityActive="settings"
        onNavigate={onNavigate}
        onLongPress={() => setAccountOpen(true)}
      />

      <ConfirmActionSheet
        open={confirmOpen}
        payload={confirmPayload}
        confirming={disconnecting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
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
