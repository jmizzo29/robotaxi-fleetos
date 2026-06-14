import MonumentSheet from './MonumentSheet';
import CommandMapPreview from '../home/CommandMapPreview';

export default function MapDetailSheet({
  open,
  onClose,
  fleet,
  realFleet,
  totalEarnings,
  syncState,
}) {
  if (!open) return null;

  return (
    <MonumentSheet open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="px-2 pb-2">
        <CommandMapPreview
          fleet={fleet}
          realFleet={realFleet}
          totalEarnings={totalEarnings}
          syncState={syncState}
          mapHeightClass="h-[52vh]"
          bare
        />
        <button
          type="button"
          onClick={onClose}
          className="mx-4 mb-2 mt-2 w-[calc(100%-2rem)] py-2.5 text-[14.4px] font-semibold"
          style={{ color: '#6B7280' }}
        >
          Close
        </button>
      </div>
    </MonumentSheet>
  );
}
