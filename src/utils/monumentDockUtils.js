/** Monument mobile dock — visual remap of existing chrome destinations only. */

export const DEFAULT_UTILITY_DOCK_ITEMS = [
  { id: 'map', label: 'Map' },
  { id: 'network', label: 'Network' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];

/** Command-home stadium: existing labels only, no Submit. Grow + Integrations stay on the swipe chain. */
export const PRIMARY_COMMAND_DOCK_IDS = ['today', 'map', 'fleet', 'network', 'settings'];

export const COMMAND_SWIPE_PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

export function buildMonumentDockItems({
  commandPages = [],
  showCommandRow = true,
  commandActive = null,
  utilityActive = null,
} = {}) {
  const commandItems = showCommandRow
    ? commandPages.map((page) => ({
      id: page.id,
      label: page.label,
      kind: 'command',
      active: page.id === commandActive,
    }))
    : [];

  const utilityItems = DEFAULT_UTILITY_DOCK_ITEMS.map((item) => ({
    ...item,
    kind: 'utility',
    active: item.id === utilityActive,
  }));

  return { commandItems, utilityItems };
}

export function buildMonumentDockRows({
  commandPages = [],
  showCommandRow = true,
  commandActive = null,
  utilityActive = null,
} = {}) {
  const { commandItems, utilityItems } = buildMonumentDockItems({
    commandPages,
    showCommandRow,
    commandActive,
    utilityActive,
  });

  const isOperations = commandItems.some((item) => (
    item.id === 'plan' || item.id === 'charge' || item.id === 'alerts'
  ));

  if (isOperations) {
    return [utilityItems, commandItems];
  }

  const byId = new Map([...commandItems, ...utilityItems].map((item) => [item.id, item]));
  return [PRIMARY_COMMAND_DOCK_IDS.map((id) => byId.get(id)).filter(Boolean)];
}

export function selectMonumentDockItem(item, {
  commandPages = [],
  onCommandSelect,
  onNavigate = () => {},
} = {}) {
  const isCommand = item?.kind === 'command'
    || commandPages.some((page) => page.id === item?.id);

  if (isCommand) {
    if (onCommandSelect) {
      onCommandSelect(item.id);
      return 'command';
    }
    onNavigate('overview');
    return 'overview';
  }

  if (item?.id) onNavigate(item.id);
  return 'utility';
}

export function isMonumentDockItemActive(itemId, {
  commandActive = null,
  utilityActive = null,
} = {}) {
  return itemId === commandActive || itemId === utilityActive;
}
