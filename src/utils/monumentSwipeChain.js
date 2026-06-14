export const MONUMENT_SWIPE_CHAIN = [
  { id: 'today', kind: 'command', route: 'overview', label: 'Today' },
  { id: 'fleet', kind: 'command', route: 'overview', label: 'Fleet' },
  { id: 'grow', kind: 'command', route: 'overview', label: 'Grow' },
  { id: 'map', kind: 'utility', route: 'map', label: 'Map' },
  { id: 'network', kind: 'utility', route: 'network', label: 'Network' },
  { id: 'integrations', kind: 'utility', route: 'integrations', label: 'Integrations' },
  { id: 'settings', kind: 'utility', route: 'settings', label: 'Settings' },
];

const COMMAND_TAB_ORDER = ['today', 'fleet', 'grow'];

export function chainIndexFromRoute(route, commandTab = 'today') {
  if (route === 'overview') {
    const tabIndex = COMMAND_TAB_ORDER.indexOf(commandTab);
    return tabIndex >= 0 ? tabIndex : 0;
  }

  const utilityIndex = MONUMENT_SWIPE_CHAIN.findIndex(
    (entry) => entry.kind === 'utility' && entry.route === route,
  );
  return utilityIndex >= 0 ? utilityIndex : 0;
}

export function chainEntryFromIndex(index) {
  return MONUMENT_SWIPE_CHAIN[Math.min(MONUMENT_SWIPE_CHAIN.length - 1, Math.max(0, index))];
}

export function chainSwipeHint(index) {
  const next = chainEntryFromIndex(index + 1);
  if (!next || index >= MONUMENT_SWIPE_CHAIN.length - 1) return null;
  return next.label;
}
