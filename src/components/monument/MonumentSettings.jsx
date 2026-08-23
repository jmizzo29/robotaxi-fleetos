import { useEffect, useMemo, useState } from 'react';
import { useFleetAuthStatus } from '../../auth/FleetAuthContext';
import SignOutButton from '../SignOutButton';
import TeslaChargingScopeNotice from '../TeslaChargingScopeNotice';
import { getFleetOsSession } from '../../services/sessionService';
import AccountSheet from './AccountSheet';
import MonumentActionFooter from './MonumentActionFooter';
import MonumentHero from './MonumentHero';
import MonumentBottomChrome from './MonumentBottomChrome';
import OperationsLedgerStrip from './OperationsLedgerStrip';
import { monument } from './monumentTokens';
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
  const [missingChargingScope, setMissingChargingScope] = useState(false);

  const teslaConnected = useMemo(
    () => isTeslaConnected(realFleet, realSyncStatus),
    [realFleet, realSyncStatus],
  );

  useEffect(() => {
    if (!teslaConnected) {
      setMissingChargingScope(false);
      return undefined;
    }
    let cancelled = false;
    getFleetOsSession()
      .then((session) => {
        if (!cancelled) setMissingChargingScope(session?.hasChargingCmds === false);
      })
      .catch(() => {
        if (!cancelled) setMissingChargingScope(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teslaConnected]);

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

      {missingChargingScope && (
        <div className="shrink-0 px-5 pb-2">
          <TeslaChargingScopeNotice compact />
        </div>
      )}

      <div className="shrink-0 px-5 pb-3 pt-2">
        <SignOutButton
          label="Sign out"
          compact
          onSignedOut={() => onNavigate('landing')}
          className="w-full min-h-12 rounded-full border border-[rgba(91,168,160,0.18)] bg-[#25262B] px-5 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-[#F3F3F1] transition hover:bg-[#2C2D33] disabled:cursor-wait disabled:opacity-60"
        />
      </div>

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
        teslaConnected={teslaConnected}
        onDisconnectTesla={onDisconnect}
      />
    </div>
  );
}
