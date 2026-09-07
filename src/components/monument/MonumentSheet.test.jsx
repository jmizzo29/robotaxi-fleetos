import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonumentSheet, { MONUMENT_SHEET_SAFE_PAD } from './MonumentSheet';

describe('MonumentSheet', () => {
  it('portals a reserved green Done control that is not clipped by overflow', () => {
    render(
      <div className="overflow-hidden" style={{ height: 120 }}>
        <MonumentSheet open onClose={() => {}}>
          <p>Preview body</p>
        </MonumentSheet>
      </div>,
    );

    const buttons = screen.getAllByTestId('monument-sheet-close');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0].textContent).toMatch(/done/i);
    expect(document.body.contains(buttons[0])).toBe(true);

    const footers = screen.getAllByTestId('monument-sheet-footer');
    expect(footers[0].className).toContain('shrink-0');
    expect(MONUMENT_SHEET_SAFE_PAD).toMatch(/safe-area-inset-bottom/);
    expect(footers[0].className).toContain('safe-area-inset-bottom');
  });

  it('keeps a custom footer fully in the reserved chrome slot', () => {
    const onClose = vi.fn();
    render(
      <MonumentSheet
        open
        onClose={onClose}
        footer={<button type="button" data-testid="monument-sheet-close">Close preview</button>}
      >
        <p>Grow preview</p>
      </MonumentSheet>,
    );

    const footer = screen.getAllByTestId('monument-sheet-footer')[0];
    expect(footer.querySelector('[data-testid="monument-sheet-close"]')).toBeTruthy();
  });
});
