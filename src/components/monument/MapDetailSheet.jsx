import MonumentSheet from './MonumentSheet';
import CommandMapPreview from '../home/CommandMapPreview';
import { monument, monumentType } from './monumentTokens';

export default function MapDetailSheet({
  open,
  onClose,
  fleet,
  realFleet,
  totalEarnings,
  syncState,
  teslaConnected = false,
  mock = false,
}) {
  if (!open) return null;

  return (
    <MonumentSheet
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={(
        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-xl py-3 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98]`}
          style={{ backgroundColor: monument.action }}
          data-testid="monument-sheet-close"
        >
          Done
        </button>
      )}
    >
      <div className="px-2">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          totalEarnings={totalEarnings}
          syncState={syncState}
          teslaConnected={teslaConnected}
          mock={mock}
          mapHeightClass="h-[52vh]"
          bare
          showChromeFooter={false}
        />
      </div>
    </MonumentSheet>
  );
}
