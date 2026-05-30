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
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
          logoPlacement: 'none',
        },
        variables: {
          colorPrimary: '#14b8a6',
          colorBackground: '#09090b',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorInputBackground: '#18181b',
          colorInputText: '#ffffff',
          colorNeutral: '#27272a',
          borderRadius: '1.25rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          card: 'border border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-black/40',
          modalBackdrop: 'bg-black/75 backdrop-blur-md',
          headerTitle: 'text-white font-black',
          headerSubtitle: 'text-zinc-400',
          formFieldLabel: 'text-zinc-300 font-semibold',
          formFieldInput: 'border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-0',
          formButtonPrimary: 'bg-teal-500 text-black hover:bg-teal-400 shadow-none font-black',
          socialButtonsBlockButton: 'border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800',
          socialButtonsBlockButtonText: 'text-white font-semibold',
          socialButtonsBlockButton__github: 'hidden',
          dividerLine: 'bg-zinc-800',
          dividerText: 'text-zinc-500',
          footer: 'bg-zinc-950 border-zinc-800',
          footerAction: 'text-zinc-400',
          footerActionLink: 'text-teal-300 hover:text-teal-200',
          identityPreviewText: 'text-zinc-300',
          formResendCodeLink: 'text-teal-300 hover:text-teal-200',
          otpCodeFieldInput: 'border-zinc-700 bg-zinc-900 text-white',
          navbarButton: 'text-zinc-400 hover:text-white',
          userButtonPopoverCard: 'border border-zinc-800 bg-zinc-950 text-white',
          userButtonPopoverActionButton: 'text-zinc-200 hover:bg-zinc-900',
          userButtonPopoverActionButtonText: 'text-zinc-200',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    >
      <ClerkSessionBridge>{children}</ClerkSessionBridge>
    </ClerkProvider>
  );
}
