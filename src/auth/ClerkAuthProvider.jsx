import { ClerkProvider, useAuth } from '@clerk/react';
import { useEffect } from 'react';
import { setAuthTokenProvider } from '../services/authTokenStore';
import { clerkPublishableKey, isClerkConfigured } from './clerkConfig';

function ClerkSessionBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthTokenProvider(null);
      return undefined;
    }

    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider(null);
  }, [getToken, isSignedIn]);

  return null;
}

export default function ClerkAuthProvider({ children }) {
  if (!isClerkConfigured()) {
    return children;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/#/onboarding"
      signUpFallbackRedirectUrl="/#/onboarding"
      afterSignOutUrl="/"
    >
      <ClerkSessionBridge />
      {children}
    </ClerkProvider>
  );
}
