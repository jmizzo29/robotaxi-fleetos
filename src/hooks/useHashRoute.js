import { useEffect, useState } from 'react';

const validRoutes = new Set(['landing', 'landing-entry', 'login', 'signup', 'signup-email', 'agent', 'about', 'how-it-works', 'onboarding', 'add-vehicle', 'overview', 'map', 'fleet', 'vehicle', 'assets', 'finance', 'health', 'charging', 'dispatch', 'readiness', 'ai', 'alerts', 'memory', 'reports', 'integrations', 'tesla', 'network', 'account', 'settings', 'admin', 'privacy', 'terms']);

function readRoute() {
  const rawHash = window.location.hash.replace('#/', '').replace('#', '');
  if (!rawHash) return 'landing';
  return validRoutes.has(rawHash) ? rawHash : 'landing';
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
