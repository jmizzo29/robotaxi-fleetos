import { ClerkProvider, useAuth } from '@clerk/react';
import { useEffect } from 'react';
import { setAuthTokenProvider } from '../services/authTokenStore';
import { clerkPublishableKey, isClerkConfigured } from './clerkConfig';
import { FleetAuthContext } from './FleetAuthContext';

function ClerkSessionBridge({ children }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthTokenProvider(null);
      return undefined;
    }

    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider(null);
  }, [getToken, isSignedIn]);

  return (
    <FleetAuthContext.Provider value={{
      isAuthReady: Boolean(isLoaded),
      isSignedIn: Boolean(isSignedIn),
      authMode: 'clerk',
    }}
    >
      {children}
    </FleetAuthContext.Provider>
  );
}

export default function ClerkAuthProvider({ children }) {
  if (!isClerkConfigured()) {
    return (
      <FleetAuthContext.Provider value={{ isAuthReady: true, isSignedIn: false, authMode: 'native' }}>
        {children}
      </FleetAuthContext.Provider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/#/onboarding"
      signUpFallbackRedirectUrl="/#/onboarding"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#7dd3fc',
          colorBackground: '#ffffff',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
          colorInputBackground: '#ffffff',
          colorInputText: '#0f172a',
          borderRadius: '0.9rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          card: 'border border-slate-200 shadow-2xl shadow-slate-300/40',
          modalBackdrop: 'bg-slate-950/45 backdrop-blur-sm',
          headerTitle: 'text-slate-950 font-black',
          headerSubtitle: 'text-slate-600',
          formButtonPrimary: 'bg-sky-300 text-slate-950 hover:bg-sky-200 shadow-none',
          socialButtonsBlockButton: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
          formFieldInput: 'border-slate-300 bg-white text-slate-950 focus:ring-sky-100 focus:border-sky-400',
          footerActionLink: 'text-sky-700 hover:text-sky-900',
        },
      }}
    >
      <ClerkSessionBridge>{children}</ClerkSessionBridge>
    </ClerkProvider>
  );
}
