import { monument } from '../../design/monumentTokens';

export default function MonumentSheet({
  open,
  onClose,
  children,
  maxWidth = 'max-w-md',
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: monument.scrim }}
        aria-label="Close"
        onClick={onClose}
      />
      <section
        className={`relative w-full ${maxWidth} overflow-hidden rounded-t-[20px]`}
        style={{ backgroundColor: monument.canvas, maxHeight: '85vh' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-9 rounded-full" style={{ backgroundColor: monument.hairline }} />
        </div>
        <div className="overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]" style={{ maxHeight: 'calc(85vh - 1.25rem)' }}>
          {children}
        </div>
      </section>
    </div>
  );
}
