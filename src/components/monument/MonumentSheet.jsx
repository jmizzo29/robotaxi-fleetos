import { createPortal } from 'react-dom';
import { monument, monumentType } from './monumentTokens';

/** Shared sheet pad — keeps the green close/done control above home indicators and overflow clip. */
export const MONUMENT_SHEET_SAFE_PAD = 'pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]';

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

function SheetFrame({
  children,
  footer,
  maxWidth,
  roundedClass,
  border = false,
  maxHeight,
  testId,
}) {
  return (
    <section
      className={`relative flex w-full min-w-0 ${maxWidth} flex-col overflow-hidden ${roundedClass} ${border ? 'border' : ''}`}
      style={{
        backgroundColor: monument.canvas,
        borderColor: border ? monument.hairline : undefined,
        maxHeight,
      }}
      role="dialog"
      aria-modal="true"
      data-testid={testId}
    >
      {children}
      <div
        className={`shrink-0 px-[18px] pt-2 ${MONUMENT_SHEET_SAFE_PAD}`}
        data-testid="monument-sheet-footer"
      >
        {footer}
      </div>
    </section>
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

  const scrollBody = (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  );

  const mobileSheet = (
    <div className="lg:hidden fixed inset-0 z-[90] flex items-end justify-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: monument.scrim }}
        aria-label="Close"
        onClick={onClose}
      />
      <SheetFrame
        footer={resolvedFooter}
        maxWidth={maxWidth}
        roundedClass="rounded-t-[20px]"
        maxHeight="min(85dvh, 100dvh)"
        testId="monument-sheet-mobile"
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full" style={{ backgroundColor: monument.hairline }} />
        </div>
        {scrollBody}
      </SheetFrame>
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
      <div
        className={`shrink-0 px-[18px] pt-2 ${MONUMENT_SHEET_SAFE_PAD}`}
        data-testid="monument-sheet-footer"
      >
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
      <SheetFrame
        footer={resolvedFooter}
        maxWidth={maxWidth}
        roundedClass="rounded-[20px]"
        border
        maxHeight="min(720px, 85dvh)"
        testId="monument-sheet-desktop"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-6">
          {children}
        </div>
      </SheetFrame>
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
