import { useEffect, useState } from 'react';

const validRoutes = new Set(['landing', 'landing-entry', 'login', 'signup', 'signup-email', 'agent', 'about', 'how-it-works', 'onboarding', 'add-vehicle', 'overview', 'map', 'fleet', 'vehicle', 'assets', 'finance', 'health', 'charging', 'dispatch', 'readiness', 'ai', 'alerts', 'memory', 'reports', 'integrations', 'tesla', 'network', 'account', 'settings', 'admin', 'privacy', 'terms']);

function readRoute() {
  const rawHash = window.location.hash.replace('#/', '').replace('#', '');
  if (!rawHash) return 'landing';
  return validRoutes.has(rawHash) ? rawHash : 'landing';
}

/** True when the user opened #/landing directly (should always show marketing). */
export function isExplicitLandingHash() {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '').replace(/^\//, '');
  return hash === 'landing' || hash === 'landing-entry';
}

/** True on first open with no hash — authed users may skip to Command. */
export function isImplicitLandingEntry() {
  if (typeof window === 'undefined') return true;
  const hash = window.location.hash;
  return !hash || hash === '#' || hash === '#/';
}

export default function useHashRoute() {
  const [route, setRoute] = useState(() => readRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextRoute) => {
    window.location.hash = `/${validRoutes.has(nextRoute) ? nextRoute : 'landing'}`;
  };

  return [route, navigate];
}
