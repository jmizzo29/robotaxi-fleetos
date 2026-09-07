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
  buildMonumentDockItems,
  selectMonumentDockItem,
} from '../../utils/monumentDockUtils';

export const COMMAND_SWIPE_PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

const DOCK_ICONS = {
  today: Home,
  fleet: Car,
  grow: TrendingUp,
  plan: ClipboardList,
  charge: BatteryCharging,
  alerts: Bell,
  map: Map,
  network: Globe2,
  integrations: Plug,
  settings: Settings,
};

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
    icon: DOCK_ICONS[item.id],
    onSelect: () => selectMonumentDockItem(item, {
      commandPages,
      onCommandSelect,
      onNavigate,
    }),
  });

  const { commandItems, utilityItems } = buildMonumentDockItems({
    commandPages,
    showCommandRow,
    commandActive,
    utilityActive,
  });
  const dockRows = [
    utilityItems.map(decorate),
    commandItems.map(decorate),
  ];

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
