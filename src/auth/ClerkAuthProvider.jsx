import { ClerkProvider, useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/react';
import { useEffect } from 'react';
import useHashRoute from '../hooks/useHashRoute';
import { setAuthTokenProvider } from '../services/authTokenStore';
import { clerkPublishableKey, isClerkConfigured } from './clerkConfig';
import { FleetAuthContext } from './FleetAuthContext';
import { SsoCallbackPage } from '../App';

const PUBLIC_AUTH_ROUTES = new Set(['landing', 'landing-entry', 'login', 'signup', 'onboarding']);

function ClerkSessionBridge({ children }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

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
      user,
    }}
    >
      {children}
    </FleetAuthContext.Provider>
  );
}

export default function ClerkAuthProvider({ children }) {
  const [route] = useHashRoute();
  const isSsoCallback = typeof window !== 'undefined' && window.location.pathname === '/sso-callback';

  // First-connect Tesla-first routes bypass Clerk UI. Add-vehicle stays inside
  // ClerkProvider so a signed-in owner cannot mint a guest OAuth session.
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.has(route);

  if (isPublicAuthRoute) {
    // Render custom dark auth pages completely outside ClerkProvider.
    // This guarantees the "Continue with Tesla Account" / "Connect Tesla Account" buttons
    // do a direct backend redirect to Tesla OAuth with no Clerk UI interference.
    return (
      <FleetAuthContext.Provider value={{ isAuthReady: true, isSignedIn: false, authMode: 'native', user: null }}>
        {children}
      </FleetAuthContext.Provider>
    );
  }

  if (!isClerkConfigured()) {
    if (isSsoCallback) {
      return <SsoCallbackPage />;
    }
    return (
      <FleetAuthContext.Provider value={{ isAuthReady: true, isSignedIn: false, authMode: 'native', user: null }}>
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
          colorPrimary: '#5BA8A0',
          colorBackground: '#1C1D21',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorInputBackground: '#18181b',
          colorInputText: '#ffffff',
          colorNeutral: '#3f3f46',
          borderRadius: '1rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          card: 'border border-white/10 bg-[#1C1D21] text-white shadow-xl shadow-black/50',
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
          footer: 'bg-[#1C1D21] border-white/10',
          footerAction: 'text-white/50',
          footerActionLink: 'text-emerald-400 hover:text-emerald-300',
          identityPreviewText: 'text-white/60',
          formResendCodeLink: 'text-emerald-400 hover:text-emerald-300',
          otpCodeFieldInput: 'border-white/20 bg-zinc-900 text-white',
          navbarButton: 'text-white/50 hover:text-white',
          userButtonPopoverCard: 'border border-white/10 bg-[#1C1D21] text-white',
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
