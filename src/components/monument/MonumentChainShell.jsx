import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AccountSheet from './AccountSheet';
import AssetDetailSheet from './AssetDetailSheet';
import ConfirmActionSheet from './ConfirmActionSheet';
import ExploreMarketSheet from './ExploreMarketSheet';
import FleetBrowseSheet from './FleetBrowseSheet';
import MonumentBottomChrome from './MonumentBottomChrome';
import MonumentCommandSlide from './MonumentCommandSlide';
import MonumentIntegrations from './MonumentIntegrations';
import MonumentMap from './MonumentMap';
import MonumentNetwork from './MonumentNetwork';
import MonumentSettings from './MonumentSettings';
import TelemetryDetailSheet from './TelemetryDetailSheet';
import TodayDetailSheet from './TodayDetailSheet';
import { monument } from './monumentTokens';
import useMonumentCommand, { FLEET_WAKE_CONFIRM } from '../../hooks/useMonumentCommand';
import {
  chainEntryFromIndex,
  chainIndexFromRoute,
  chainSwipeHint,
  MONUMENT_SWIPE_CHAIN,
} from '../../utils/monumentSwipeChain';

export default function MonumentChainShell({
  route = 'overview',
  fleet = [],
  realFleet = [],
  realSyncStatus = null,
  isLoadingReal = false,
  commandQueue = [],
  aiAnalysis = null,
  onQueueCommand = () => {},
  onNavigate = () => {},
  onSync = () => {},
  onDisconnect = null,
}) {
  const [commandTab, setCommandTab] = useState('today');
  const pagerRef = useRef(null);
  const scrollRaf = useRef(null);
  const syncingRef = useRef(false);

  const command = useMonumentCommand({
    fleet,
    realFleet,
    realSyncStatus,
    isLoadingReal,
    commandQueue,
    onQueueCommand,
    onNavigate,
    onSync,
  });

  const chainIndex = useMemo(
    () => chainIndexFromRoute(route, commandTab),
    [route, commandTab],
  );

  useEffect(() => {
    const el = pagerRef.current;
    if (!el || el.clientWidth === 0) return;
    const targetLeft = chainIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - targetLeft) <= 4) return;
    syncingRef.current = true;
    el.scrollTo({ left: targetLeft, behavior: 'auto' });
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [chainIndex]);

  const applyChainIndex = useCallback((index) => {
    const entry = chainEntryFromIndex(index);
    if (entry.kind === 'command') {
      setCommandTab(entry.id);
      if (route !== 'overview') onNavigate('overview');
      return;
    }
    if (route !== entry.route) onNavigate(entry.route);
  }, [onNavigate, route]);

  const handlePagerScroll = useCallback(() => {
    if (syncingRef.current) return;
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const el = pagerRef.current;
      if (!el || el.clientWidth === 0) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      applyChainIndex(index);
    });
  }, [applyChainIndex]);

  const scrollToChainIndex = useCallback((index) => {
    const el = pagerRef.current;
    if (!el) return;
    syncingRef.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    applyChainIndex(index);
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [applyChainIndex]);

  const handleUtilitySelect = useCallback((utilityId) => {
    const index = MONUMENT_SWIPE_CHAIN.findIndex((entry) => entry.id === utilityId);
    if (index >= 0) scrollToChainIndex(index);
  }, [scrollToChainIndex]);

  const handleCommandSelect = useCallback((tabId) => {
    const index = MONUMENT_SWIPE_CHAIN.findIndex((entry) => entry.id === tabId);
    if (index >= 0) scrollToChainIndex(index);
  }, [scrollToChainIndex]);

  const utilityActive = chainIndex >= 3 ? chainEntryFromIndex(chainIndex).id : null;
  const commandActive = chainIndex <= 2 ? chainEntryFromIndex(chainIndex).id : null;
  const swipeHint = chainSwipeHint(chainIndex);

  const sharedUtilityProps = {
    fleet,
    realFleet,
    realSyncStatus,
    isLoadingReal,
    aiAnalysis,
    onNavigate,
    onSync,
    onDisconnect,
    embedded: true,
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: monument.canvas }}
    >
      <div
        ref={pagerRef}
        onScroll={handlePagerScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {command.pages.map((page) => (
          <section
            key={page.id}
            className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col"
            aria-label={page.id}
          >
            <MonumentCommandSlide
              page={page}
              strip={command.strip}
              onHeroTap={command.handleHeroTap}
              onDoIt={command.handleDoIt}
              onFleetStatusSelect={command.handleFleetStatusSelect}
            />
          </section>
        ))}

        <section className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col" aria-label="map">
          <MonumentMap {...sharedUtilityProps} />
        </section>
        <section className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col" aria-label="network">
          <MonumentNetwork {...sharedUtilityProps} />
        </section>
        <section className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col" aria-label="integrations">
          <MonumentIntegrations {...sharedUtilityProps} />
        </section>
        <section className="flex min-h-0 w-full shrink-0 snap-center snap-always flex-col" aria-label="settings">
          <MonumentSettings {...sharedUtilityProps} />
        </section>
      </div>

      <div className="lg:hidden">
        <MonumentBottomChrome
          utilityActive={utilityActive}
          commandActive={commandActive}
          onNavigate={handleUtilitySelect}
          onCommandSelect={handleCommandSelect}
          onLongPress={() => command.setAccountOpen(true)}
          swipeHint={swipeHint}
        />
      </div>

      <ConfirmActionSheet
        open={command.confirmOpen}
        payload={command.action.confirm}
        confirming={command.confirming}
        onClose={() => command.setConfirmOpen(false)}
        onConfirm={command.handleConfirm}
      />

      <ConfirmActionSheet
        open={command.wakeConfirmOpen}
        payload={FLEET_WAKE_CONFIRM}
        confirming={command.wakingFleet}
        onClose={() => command.setWakeConfirmOpen(false)}
        onConfirm={command.handleWakeConfirm}
      />

      <AssetDetailSheet
        open={command.assetOpen}
        payload={command.assetPayload}
        onClose={() => command.setAssetOpen(false)}
        onLetItRun={() => command.setAssetOpen(false)}
        onNudgeRoute={command.handleNudgeRoute}
        nudging={command.nudging}
        onViewTelemetry={() => {
          command.setAssetOpen(false);
          command.openTelemetrySheet(command.assetPayload?.cab);
        }}
      />

      <TelemetryDetailSheet
        open={command.telemetryOpen}
        payload={command.telemetryPayload}
        onClose={() => command.setTelemetryOpen(false)}
      />

      <FleetBrowseSheet
        open={command.fleetBrowseOpen}
        tileKey={command.fleetBrowseKey}
        fleet={fleet}
        realFleet={realFleet}
        totalEarnings={command.totalEarnings}
        syncState={command.syncState}
        onClose={() => command.setFleetBrowseOpen(false)}
        onViewTelemetry={(cab) => {
          command.setFleetBrowseOpen(false);
          command.openTelemetrySheet(cab);
        }}
      />

      <ExploreMarketSheet
        open={command.exploreOpen}
        payload={command.growPayload}
        onClose={() => command.setExploreOpen(false)}
        onStagePlan={command.handleStagePlan}
        onCompare={command.handleCompareMarket}
        staging={command.staging}
      />

      <TodayDetailSheet
        open={command.todayOpen}
        payload={command.todayPayload}
        onClose={() => command.setTodayOpen(false)}
        onSelectRow={command.handleLedgerRow}
      />

      <AccountSheet
        open={command.accountOpen}
        payload={command.accountPayload}
        onClose={() => command.setAccountOpen(false)}
        onNavigate={onNavigate}
        onSignOut={command.handleSignOut}
        signingOut={command.signingOut}
        teslaConnected={command.teslaConnected}
        onDisconnectTesla={onDisconnect}
        feedbackRoute={route}
      />
    </div>
  );
}
