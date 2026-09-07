import { Globe2, LayoutGrid, Map, Plug, Settings, Wrench } from 'lucide-react';
import { mobileNavItems } from '../design/roboagentTokens';
import FloatingPillDock from './FloatingPillDock';

const ICONS = {
  overview: LayoutGrid,
  dispatch: Wrench,
  map: Map,
  network: Globe2,
  integrations: Plug,
  settings: Settings,
};

export default function MobileBottomNav({ route, onNavigate, pendingCount = 0 }) {
  const items = mobileNavItems.map(({ id, label, routes }) => {
    const active = routes.includes(route);
    const showBadge = id === 'dispatch' && pendingCount > 0;

    return {
      id,
      label,
      icon: ICONS[id],
      active,
      badge: showBadge ? (pendingCount > 9 ? '9+' : pendingCount) : null,
      onSelect: () => onNavigate(id),
    };
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <FloatingPillDock
        items={items}
        ariaLabel="Primary navigation"
      />
    </div>
  );
}
