import { useCallback, useState } from 'react';
import { TESLA_DISCONNECT_CONFIRM } from '../utils/monumentUtils';

export default function useMonumentTeslaDisconnect(onDisconnect = null) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');

  const requestDisconnect = useCallback(() => {
    setError('');
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!onDisconnect) return;
    setDisconnecting(true);
    setError('');
    try {
      await onDisconnect();
      setConfirmOpen(false);
    } catch (disconnectError) {
      setError(disconnectError.message || 'Unable to disconnect Tesla. Try again.');
    } finally {
      setDisconnecting(false);
    }
  }, [onDisconnect]);

  return {
    confirmOpen,
    setConfirmOpen,
    disconnecting,
    error,
    confirmPayload: TESLA_DISCONNECT_CONFIRM,
    requestDisconnect,
    handleConfirm,
  };
}
