import { useState } from 'react';
import { startTeslaOAuth } from '../services/teslaHealthService';
import LandingEntryScreen from '../components/landing/LandingEntryScreen';

export default function Landing({ onNavigate }) {
  const [isTeslaLoading, setIsTeslaLoading] = useState(false);
  const [oauthError, setOauthError] = useState('');

  const handleTeslaAuth = () => {
    setOauthError('');
    setIsTeslaLoading(true);
    const result = startTeslaOAuth('overview');
    if (result?.ok === false) {
      setIsTeslaLoading(false);
      setOauthError(result.message);
    }
  };

  return (
    <LandingEntryScreen
      onNavigate={onNavigate}
      onConnect={handleTeslaAuth}
      connectDisabled={isTeslaLoading}
      oauthError={oauthError}
    />
  );
}
