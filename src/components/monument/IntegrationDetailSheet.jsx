import MonumentSheet from './MonumentSheet';
import { monument, monumentType } from './monumentTokens';

export default function IntegrationDetailSheet({
  open,
  payload,
  onClose,
  showDisconnect = false,
  onDisconnect,
  disconnecting = false,
}) {
  if (!payload) return null;

  return (
    <MonumentSheet open={open} onClose={onClose}>
      <div className="px-[18px] pb-2">
        <p className={monumentType.label} style={{ color: monument.inkGhost }}>Integration</p>
        <h2 className={`mt-2.5 ${monumentType.sheetTitle}`} style={{ color: monument.ink }}>{payload.title}</h2>
        <p className={`mt-2 ${monumentType.sheetBody}`} style={{ color: monument.inkMuted }}>{payload.body}</p>
        <p className={`mt-4 ${monumentType.monoSm}`} style={{ color: monument.money }}>{payload.status}</p>
        {showDisconnect && onDisconnect && (
          <button
            type="button"
            disabled={disconnecting}
            onClick={onDisconnect}
            className={`mt-4 w-full py-2.5 ${monumentType.actionLink} disabled:opacity-60`}
            style={{ color: monument.projected }}
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect Tesla'}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`mt-4 w-full py-2.5 ${monumentType.actionLink}`}
          style={{ color: monument.inkMuted }}
        >
          Close
        </button>
      </div>
    </MonumentSheet>
  );
}
