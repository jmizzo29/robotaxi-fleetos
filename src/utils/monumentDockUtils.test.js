import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_UTILITY_DOCK_ITEMS,
  buildMonumentDockItems,
  isMonumentDockItemActive,
  selectMonumentDockItem,
} from './monumentDockUtils';

const COMMAND_PAGES = [
  { id: 'today', label: 'Today' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'grow', label: 'Grow' },
];

describe('monumentDockUtils', () => {
  it('keeps the live utility destinations and does not invent Submit', () => {
    expect(DEFAULT_UTILITY_DOCK_ITEMS.map((item) => item.id)).toEqual([
      'map',
      'network',
      'integrations',
      'settings',
    ]);
    expect(DEFAULT_UTILITY_DOCK_ITEMS.some((item) => item.id === 'submit')).toBe(false);
  });

  it('builds a 1:1 remap of command pages plus utilities', () => {
    const { commandItems, utilityItems } = buildMonumentDockItems({
      commandPages: COMMAND_PAGES,
      commandActive: 'fleet',
      utilityActive: null,
    });

    expect(commandItems.map((item) => item.id)).toEqual(['today', 'fleet', 'grow']);
    expect(utilityItems.map((item) => item.id)).toEqual([
      'map',
      'network',
      'integrations',
      'settings',
    ]);
    expect(commandItems.find((item) => item.id === 'fleet')?.active).toBe(true);
    expect(utilityItems.every((item) => item.active === false)).toBe(true);
  });

  it('marks the live utility route active without renaming it', () => {
    const { utilityItems } = buildMonumentDockItems({
      commandPages: COMMAND_PAGES,
      utilityActive: 'network',
    });
    expect(utilityItems.find((item) => item.id === 'network')?.active).toBe(true);
    expect(isMonumentDockItemActive('network', { utilityActive: 'network' })).toBe(true);
    expect(isMonumentDockItemActive('today', { utilityActive: 'network' })).toBe(false);
  });

  it('routes command taps through onCommandSelect and utility taps through onNavigate', () => {
    const onCommandSelect = vi.fn();
    const onNavigate = vi.fn();

    expect(selectMonumentDockItem(
      { id: 'grow', kind: 'command' },
      { commandPages: COMMAND_PAGES, onCommandSelect, onNavigate },
    )).toBe('command');
    expect(onCommandSelect).toHaveBeenCalledWith('grow');
    expect(onNavigate).not.toHaveBeenCalled();

    expect(selectMonumentDockItem(
      { id: 'map', kind: 'utility' },
      { commandPages: COMMAND_PAGES, onCommandSelect, onNavigate },
    )).toBe('utility');
    expect(onNavigate).toHaveBeenCalledWith('map');
  });

  it('falls back to overview when a command tap has no section handler', () => {
    const onNavigate = vi.fn();
    expect(selectMonumentDockItem(
      { id: 'today', kind: 'command' },
      { commandPages: COMMAND_PAGES, onNavigate },
    )).toBe('overview');
    expect(onNavigate).toHaveBeenCalledWith('overview');
  });

  it('can hide the command row without dropping utility handlers', () => {
    const { commandItems, utilityItems } = buildMonumentDockItems({
      commandPages: COMMAND_PAGES,
      showCommandRow: false,
      utilityActive: 'settings',
    });
    expect(commandItems).toEqual([]);
    expect(utilityItems.find((item) => item.id === 'settings')?.active).toBe(true);
  });
});
