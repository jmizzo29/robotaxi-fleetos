import { useUser } from '@clerk/react';
import { isClerkConfigured } from './clerkConfig';

export default function useFleetAuthStatus() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isClerkConfigured()) {
    return {
      isAuthReady: true,
      isSignedIn: true,
      authMode: 'native',
    };
  }

  return {
    isAuthReady: isLoaded,
    isSignedIn: Boolean(isSignedIn),
    authMode: 'clerk',
  };
}
