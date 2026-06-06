import { ClerkProvider, useAuth, AuthenticateWithRedirectCallback } from '@clerk/react';
import { useEffect } from 'react';
import { setAuthTokenProvider } from '../services/authTokenStore';
import { clerkPublishableKey, isClerkConfigured } from './clerkConfig';
import { FleetAuthContext } from './FleetAuthContext';
import { SsoCallbackPage } from '../App';

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
  const isSsoCallback = typeof window !== 'undefined' && window.location.pathname === '/sso-callback';

  // Detect public auth routes (login, signup, onboarding) based on hash routing
  // These use custom dark Tesla-first flows and must bypass Clerk entirely to avoid
  // the white "Sign in to RoboAgent" screen (especially on mobile).
  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const route = currentHash.replace('#/', '') || currentPath.replace('/', '');
  const isPublicAuthRoute = ['login', 'signup', 'onboarding'].includes(route);

  if (isPublicAuthRoute) {
    // Render custom dark auth pages completely outside ClerkProvider.
    // This guarantees the "Continue with Tesla Account" / "Connect Tesla Account" buttons
    // do a direct backend redirect to Tesla OAuth with no Clerk UI interference.
    return (
      <FleetAuthContext.Provider value={{ isAuthReady: true, isSignedIn: false, authMode: 'native' }}>
        {children}
      </FleetAuthContext.Provider>
    );
  }

  if (!isClerkConfigured()) {
    if (isSsoCallback) {
      return <SsoCallbackPage />;
    }
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
          colorPrimary: '#10b981',
          colorBackground: '#0a0a0a',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorInputBackground: '#18181b',
          colorInputText: '#ffffff',
          colorNeutral: '#3f3f46',
          borderRadius: '1rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          card: 'border border-white/10 bg-[#0a0a0a] text-white shadow-xl shadow-black/50',
          modalBackdrop: 'bg-black/60 backdrop-blur-sm',
          headerTitle: 'text-white font-semibold tracking-tight',
          headerSubtitle: 'text-white/70',
          formFieldLabel: 'text-white/60 font-medium',
          formFieldInput: 'border-white/20 bg-zinc-900 text-white placeholder:text-white/40 focus:border-emerald-500 focus:ring-0',
          formButtonPrimary: 'bg-white text-black hover:bg-white/90 shadow-none font-semibold',
          socialButtonsBlockButton: 'border border-white/20 bg-white text-black hover:bg-white/90',
          socialButtonsBlockButtonText: 'text-black font-medium',
          socialButtonsBlockButton__github: 'hidden',
          socialButtonsBlockButton__apple: 'hidden',
          dividerLine: 'bg-white/10',
          dividerText: 'text-white/50',
          footer: 'bg-[#0a0a0a] border-white/10',
          footerAction: 'text-white/50',
          footerActionLink: 'text-emerald-400 hover:text-emerald-300',
          identityPreviewText: 'text-white/60',
          formResendCodeLink: 'text-emerald-400 hover:text-emerald-300',
          otpCodeFieldInput: 'border-white/20 bg-zinc-900 text-white',
          navbarButton: 'text-white/50 hover:text-white',
          userButtonPopoverCard: 'border border-white/10 bg-[#0a0a0a] text-white',
          userButtonPopoverActionButton: 'text-white/80 hover:bg-white/5',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    >
      {isSsoCallback ? (
        <>
          <AuthenticateWithRedirectCallback />
          <SsoCallbackPage />
        </>
      ) : (
        <ClerkSessionBridge>{children}</ClerkSessionBridge>
      )}
    </ClerkProvider>
  );
}
