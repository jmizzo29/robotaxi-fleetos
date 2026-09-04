import { monument } from './monumentTokens';

export default function MonumentSheet({
  open,
  onClose,
  children,
  maxWidth = 'max-w-md',
  desktop = 'modal',
}) {
  if (!open) return null;

  const mobileSheet = (
    <div className={`lg:hidden fixed inset-0 z-[90] flex items-end justify-center`} role="presentation">
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

  if (desktop === 'panel') {
    return (
      <>
        {mobileSheet}
        <aside
          className="hidden lg:flex fixed inset-y-0 right-0 z-[90] w-[min(28rem,calc(100vw-16rem))] min-w-0 flex-col border-l"
          style={{ backgroundColor: monument.canvas, borderColor: monument.hairline }}
          role="dialog"
          aria-modal="false"
          aria-label="Fleet ledger"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pt-6 pb-6">
            {children}
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {mobileSheet}
      <div className="hidden lg:flex fixed inset-0 z-[90] items-center justify-center p-8" role="presentation">
        <button
          type="button"
          className="absolute inset-0"
          style={{ backgroundColor: monument.scrim }}
          aria-label="Close"
          onClick={onClose}
        />
        <section
          className={`relative w-full ${maxWidth} min-w-0 overflow-hidden rounded-[20px] border`}
          style={{
            backgroundColor: monument.canvas,
            borderColor: monument.hairline,
            maxHeight: 'min(720px, 85vh)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="overflow-y-auto overflow-x-hidden py-6" style={{ maxHeight: 'min(720px, 85vh)' }}>
            {children}
          </div>
        </section>
      </div>
    </>
  );
}
