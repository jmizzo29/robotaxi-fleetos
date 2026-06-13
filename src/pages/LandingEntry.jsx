import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import LandingEntryScreen from '../components/landing/LandingEntryScreen';

/** Ultra-minimal app entry experiment — separate from the main landing page. */
export default function LandingEntry({ onNavigate }) {
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);

  const handleTeslaAuth = () => {
    setIsTeslaLoading(true);
    startTeslaOAuth('overview');
  };

  const connectLabel = isTeslaLoading ? (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 size={18} className="animate-spin" />
      Connecting…
    </span>
  ) : (
    'Connect Tesla'
  );

  return (
    <LandingEntryScreen
      onNavigate={onNavigate}
      onConnect={handleTeslaAuth}
      connectLabel={connectLabel}
      connectDisabled={isTeslaLoading}
    />
  );
}
