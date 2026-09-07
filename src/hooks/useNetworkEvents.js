import { useEffect, useState } from 'react';
import { emptyNetworkEventsState, fetchNetworkEvents } from '../services/networkEventsService';

export default function useNetworkEvents() {
  const [state, setState] = useState({
    ...emptyNetworkEventsState(),
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetchNetworkEvents()
      .then((payload) => {
        if (cancelled) return;
        setState({
          ...emptyNetworkEventsState(),
          ...payload,
          loading: false,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          ...emptyNetworkEventsState(),
          loading: false,
          error: error.message || 'Unable to load public events.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
