import { useState } from 'react';
import ConfirmActionSheet from './ConfirmActionSheet';
import MonumentFeedbackSheet from './MonumentFeedbackSheet';
import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

export default function AccountSheet({
  open,
  payload,
  onClose,
  onNavigate,
  onSignOut,
  signingOut = false,
  teslaConnected = false,
  onDisconnectTesla,
  feedbackRoute = 'overview',
}) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!payload) return null;

  const handleDisconnect = async () => {
    if (!onDisconnectTesla) return;
    setDisconnecting(true);
    setDisconnectError('');
    try {
      await onDisconnectTesla();
      setConfirmDisconnect(false);
      onClose?.();
    } catch (error) {
      setDisconnectError(error.message || 'Unable to disconnect Tesla. Try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <MonumentSheet open={open} onClose={onClose} maxWidth="max-w-md">
        <div className="pb-2">
          <p className={`px-[18px] ${monumentType.label}`} style={{ color: monument.inkGhost }}>Account</p>

          <div className="px-[18px] pt-2.5">
            <h2 className={`${monumentType.sheetTitle}`} style={{ color: monument.ink }}>{payload.name}</h2>
            <p className={`mt-1 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>
              {payload.subtitle}
            </p>
          </div>

          {payload.rows.map((row) => {
            const interactive = Boolean(row.route || row.action);
            return (
              <button
                key={row.label}
                type="button"
                disabled={!interactive}
                onClick={() => {
                  if (row.route) {
                    onClose?.();
                    onNavigate?.(row.route);
                    return;
                  }
                  if (row.action === 'feedback') {
                    setFeedbackOpen(true);
                  }
                }}
                className={`flex w-full items-center justify-between border-t px-[18px] py-3 text-left ${monumentType.sheetBody} ${
                  interactive ? 'transition active:bg-black/[0.02]' : 'cursor-default'
                }`}
                style={{ borderColor: monument.hairline }}
              >
                <span style={{ color: monument.ink }}>{row.label}</span>
                <span className="font-semibold" style={{ color: monument.inkMuted }}>{row.value}</span>
              </button>
            );
          })}

          {teslaConnected && onDisconnectTesla && (
            <button
              type="button"
              onClick={() => {
                setDisconnectError('');
                setConfirmDisconnect(true);
              }}
              className={`mt-2 w-full py-2.5 ${monumentType.actionLink}`}
              style={{ color: monument.projected }}
            >
              Disconnect Tesla
            </button>
          )}

          <button
            type="button"
            disabled={signingOut}
            onClick={onSignOut}
            className={`w-full py-2.5 ${monumentType.revealHint} disabled:opacity-60`}
            style={{ color: monument.inkGhost }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </MonumentSheet>

      <ConfirmActionSheet
        open={confirmDisconnect}
        payload={{
          title: 'Disconnect Tesla?',
          body: 'ROBOAGENT will stop syncing your fleet. Reconnect anytime from the home screen. For a full revoke, also remove ROBOAGENT from Tesla third-party access in your Tesla app.',
          primaryLabel: 'Disconnect',
        }}
        confirming={disconnecting}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={handleDisconnect}
      />

      {disconnectError && (
        <p className="sr-only" role="alert">{disconnectError}</p>
      )}

      <MonumentFeedbackSheet
        open={feedbackOpen}
        route={feedbackRoute}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}
