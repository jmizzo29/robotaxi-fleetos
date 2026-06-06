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
          colorPrimary: '#172231',
          colorBackground: '#ffffff',
          colorText: '#141b27',
          colorTextSecondary: '#64748b',
          colorInputBackground: '#ffffff',
          colorInputText: '#141b27',
          colorNeutral: '#e2e8f0',
          borderRadius: '1.25rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          card: 'border border-slate-200 bg-white text-[#141b27] shadow-xl shadow-slate-900/10',
          modalBackdrop: 'bg-slate-950/25 backdrop-blur-sm',
          headerTitle: 'text-[#141b27] font-semibold tracking-tight',
          headerSubtitle: 'text-slate-500',
          formFieldLabel: 'text-slate-600 font-medium',
          formFieldInput: 'border-slate-300 bg-white text-[#141b27] placeholder:text-slate-400 focus:border-[#172231] focus:ring-0',
          formButtonPrimary: 'bg-[#172231] text-white hover:bg-[#243044] shadow-none font-semibold',
          socialButtonsBlockButton: 'border border-slate-300 bg-white text-[#141b27] hover:bg-slate-50',
          socialButtonsBlockButtonText: 'text-[#141b27] font-medium',
          socialButtonsBlockButton__github: 'hidden',
          socialButtonsBlockButton__apple: 'hidden',
          dividerLine: 'bg-slate-200',
          dividerText: 'text-slate-500',
          footer: 'bg-white border-slate-200',
          footerAction: 'text-slate-500',
          footerActionLink: 'text-[#172231] hover:text-black',
          identityPreviewText: 'text-slate-600',
          formResendCodeLink: 'text-[#172231] hover:text-black',
          otpCodeFieldInput: 'border-slate-300 bg-white text-[#141b27]',
          navbarButton: 'text-slate-500 hover:text-[#141b27]',
          userButtonPopoverCard: 'border border-slate-200 bg-white text-[#141b27]',
          userButtonPopoverActionButton: 'text-slate-700 hover:bg-slate-100',
          userButtonPopoverActionButtonText: 'text-slate-700',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    >
      <ClerkSessionBridge>{children}</ClerkSessionBridge>
    </ClerkProvider>
  );
}
