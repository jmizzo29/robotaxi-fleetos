import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import AccountSheet from './AccountSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import IntegrationDetailSheet from './IntegrationDetailSheet';
import IntegrationsMonumentPanel from './IntegrationsMonumentPanel';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentBottomChrome from './MonumentBottomChrome';
import { monument } from './monumentTokens';
import { clearLocalComplianceState } from '../../services/betaCompliance';
import { logoutFleetOsAccount } from '../../services/sessionService';
import useMonumentTeslaDisconnect from '../../hooks/useMonumentTeslaDisconnect';
import { getAccountSheetPayload, isTeslaConnected } from '../../utils/monumentUtils';
import {
  getIntegrationDetail,
  getIntegrationsConvoy,
  getIntegrationsFooterLine,
  getIntegrationsHero,
} from '../../utils/integrationsMonumentUtils';

export default function MonumentIntegrations({
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  aiAnalysis = null,
  onNavigate = () => {},
  onDisconnect = null,
}) {
  const { user } = useUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKey, setDetailKey] = useState('tesla');
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

  const convoy = useMemo(
    () => getIntegrationsConvoy(realSyncStatus, aiAnalysis),
    [realSyncStatus, aiAnalysis],
  );
  const hero = useMemo(() => getIntegrationsHero(convoy), [convoy]);
  const footerLine = useMemo(() => getIntegrationsFooterLine(convoy), [convoy]);
  const detailPayload = useMemo(
    () => getIntegrationDetail(detailKey, convoy),
    [detailKey, convoy],
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
        amountColor="action"
        onTapAmount={() => {
          setDetailKey('tesla');
          setDetailOpen(true);
        }}
      />

      <IntegrationsMonumentPanel
        convoy={convoy}
        onSelectTile={(key) => {
          setDetailKey(key);
          setDetailOpen(true);
        }}
      />

      <MonumentActionFooter
        line={footerLine}
        doItLabel="View Tesla"
        onDoIt={() => {
          setDetailKey('tesla');
          setDetailOpen(true);
        }}
        secondaryLabel={teslaConnected ? 'Disconnect Tesla' : null}
        onSecondary={teslaConnected ? requestDisconnect : undefined}
      />

      <MonumentBottomChrome
        utilityActive="integrations"
        onNavigate={onNavigate}
        onLongPress={() => setAccountOpen(true)}
      />

      <IntegrationDetailSheet
        open={detailOpen}
        payload={detailPayload}
        onClose={() => setDetailOpen(false)}
        showDisconnect={detailKey === 'tesla' && teslaConnected}
        onDisconnect={requestDisconnect}
        disconnecting={disconnecting}
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
