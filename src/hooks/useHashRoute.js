import { useEffect, useState } from 'react';

const validRoutes = new Set(['overview', 'map', 'fleet', 'ai', 'alerts', 'settings']);

function readRoute() {
  const route = window.location.hash.replace('#/', '').replace('#', '') || 'overview';
  return validRoutes.has(route) ? route : 'overview';
}

export default function useHashRoute() {
  const [route, setRoute] = useState(() => readRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextRoute) => {
    window.location.hash = `/${validRoutes.has(nextRoute) ? nextRoute : 'overview'}`;
  };

  return [route, navigate];
}
