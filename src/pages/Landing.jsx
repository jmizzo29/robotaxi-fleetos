import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import LandingScreenFlow from '../components/landing/LandingScreenFlow';

export default function Landing({ onNavigate }) {
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
    <LandingScreenFlow
      onNavigate={onNavigate}
      onConnect={handleTeslaAuth}
      connectLabel={connectLabel}
      connectDisabled={isTeslaLoading}
    />
  );
}
