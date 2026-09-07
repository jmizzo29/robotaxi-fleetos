import {
  BatteryCharging,
  Bell,
  Car,
  ClipboardList,
  Globe2,
  Home,
  Map,
  Plug,
  Settings,
  TrendingUp,
} from 'lucide-react';
import FloatingPillDock from '../FloatingPillDock';
import {
  COMMAND_SWIPE_PAGES,
  buildMonumentDockRows,
  selectMonumentDockItem,
} from '../../utils/monumentDockUtils';

function dockIconFor(id) {
  switch (id) {
    case 'today': return Home;
    case 'fleet': return Car;
    case 'grow': return TrendingUp;
    case 'plan': return ClipboardList;
    case 'charge': return BatteryCharging;
    case 'alerts': return Bell;
    case 'map': return Map;
    case 'network': return Globe2;
    case 'integrations': return Plug;
    case 'settings': return Settings;
    default: return null;
  }
}

export default function MonumentBottomChrome({
  utilityActive = null,
  onNavigate = () => {},
  commandActive = null,
  commandPages = COMMAND_SWIPE_PAGES,
  onCommandSelect,
  onLongPress,
  showCommandRow = true,
  commandAriaLabel = 'Command sections',
  showSwipeHint = true,
  swipeHint = null,
}) {
  const decorate = (item) => ({
    ...item,
    icon: dockIconFor(item.id),
    onSelect: () => selectMonumentDockItem(item, {
      commandPages,
      onCommandSelect,
      onNavigate,
    }),
  });

  const dockRows = buildMonumentDockRows({
    commandPages,
    showCommandRow,
    commandActive,
    utilityActive,
  }).map((row) => row.map(decorate));

  const activeIndex = commandPages.findIndex((page) => page.id === commandActive);
  const nextCommandLabel = activeIndex >= 0 && activeIndex < commandPages.length - 1
    ? commandPages[activeIndex + 1].label
    : null;
  const hintLabel = swipeHint || nextCommandLabel;
  const hint = showSwipeHint && Boolean(hintLabel) && (swipeHint || commandActive)
    ? `Swipe for ${hintLabel}`
    : null;
  const ariaLabel = showCommandRow
    ? `Fleet navigation, ${commandAriaLabel}`
    : 'Fleet utilities';

  return (
    <div className="shrink-0">
      <FloatingPillDock
        rows={dockRows}
        ariaLabel={ariaLabel}
        onLongPress={onLongPress}
        hint={hint}
      />
    </div>
  );
}
