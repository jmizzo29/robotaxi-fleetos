/** Local-only visual gallery. Never ships in production builds. */
import { useMemo, useState } from 'react';
import MonumentChainShell from '../components/monument/MonumentChainShell';

const TABS = [
  { id: 'overview', label: 'Command' },
  { id: 'map', label: 'Map' },
  { id: 'network', label: 'Network' },
];

export default function VibeGallery() {
  const [route, setRoute] = useState('overview');
  const emptyFleet = useMemo(() => [], []);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex shrink-0 gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoute(tab.id)}
            className={`rounded-full px-3 py-1 ${route === tab.id ? 'bg-white text-black' : 'bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto h-[812px] w-[390px] overflow-hidden border border-white/10">
        <MonumentChainShell
          route={route}
          fleet={emptyFleet}
          realFleet={emptyFleet}
          realSyncStatus={{ state: 'idle' }}
          isLoadingReal={false}
          commandQueue={emptyFleet}
          onNavigate={setRoute}
        />
      </div>
    </div>
  );
}
