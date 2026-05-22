import { createContext, useContext } from 'react';

export const FleetAuthContext = createContext({
  isAuthReady: true,
  isSignedIn: false,
  authMode: 'none',
});

export function useFleetAuthStatus() {
  return useContext(FleetAuthContext);
}
