import { createPortal } from 'react-dom';
import { monument, monumentType } from './monumentTokens';

export function MonumentSheetCloseButton({ onClick, children = 'Done' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl py-3 ${monumentType.buttonPrimary} text-white transition active:scale-[0.98]`}
      style={{ backgroundColor: monument.action }}
      data-testid="monument-sheet-close"
    >
      {children}
    </button>
  );
}

function SheetChrome({
  children,
  footer,
  maxWidth,
  roundedClass,
  border = false,
  maxHeight,
  testId,
  handle = false,
}) {
  return (
    <div
      className={`relative flex w-full min-w-0 ${maxWidth} min-h-0 flex-col ${roundedClass} ${border ? 'border' : ''}`}
      style={{
        backgroundColor: monument.canvas,
        borderColor: border ? monument.hairline : undefined,
        maxHeight,
      }}
      data-testid={testId}
    >
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {handle && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5">
            <div className="h-1 w-9 rounded-full" style={{ backgroundColor: monument.hairline }} />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </section>
      <div className="monument-sheet-footer" data-testid="monument-sheet-footer">
        {footer}
      </div>
    </div>
  );
}

export default function MonumentSheet({
  open,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-md',
  desktop = 'modal',
}) {
  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const resolvedFooter = footer === undefined
    ? <MonumentSheetCloseButton onClick={onClose} />
    : footer;

  const mobileSheet = (
    <div
      className="lg:hidden fixed inset-0 z-[90] flex items-end justify-center px-0 pb-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: monument.scrim }}
        aria-label="Close"
        onClick={onClose}
      />
      <SheetChrome
        footer={resolvedFooter}
        maxWidth={maxWidth}
        roundedClass="rounded-t-[20px]"
        maxHeight="min(85dvh, calc(100dvh - 1rem))"
        testId="monument-sheet-mobile"
        handle
      >
        {children}
      </SheetChrome>
    </div>
  );

  const desktopNode = desktop === 'panel' ? (
    <aside
      className="hidden lg:flex fixed inset-y-0 right-0 z-[90] w-[min(28rem,calc(100vw-16rem))] min-w-0 flex-col border-l"
      style={{ backgroundColor: monument.canvas, borderColor: monument.hairline }}
      role="dialog"
      aria-modal="false"
      aria-label="Fleet ledger"
      data-testid="monument-sheet-desktop-panel"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pt-6">
        {children}
      </div>
      <div className="monument-sheet-footer" data-testid="monument-sheet-footer">
        {resolvedFooter}
      </div>
    </aside>
  ) : (
    <div className="hidden lg:flex fixed inset-0 z-[90] items-center justify-center p-8" role="presentation">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: monument.scrim }}
        aria-label="Close"
        onClick={onClose}
      />
      <SheetChrome
        footer={resolvedFooter}
        maxWidth={maxWidth}
        roundedClass="rounded-[20px]"
        border
        maxHeight="min(720px, calc(85dvh - 2rem))"
        testId="monument-sheet-desktop"
      >
        <div className="pt-6">
          {children}
        </div>
      </SheetChrome>
    </div>
  );

  return createPortal(
    <>
      {mobileSheet}
      {desktopNode}
    </>,
    document.body,
  );
}
