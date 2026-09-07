import { describe, expect, it } from 'vitest';
import { isMockPreviewEnabled } from './mockPreview';

describe('isMockPreviewEnabled', () => {
  it('is true only for an explicit mock query flag', () => {
    expect(isMockPreviewEnabled('?mock')).toBe(true);
    expect(isMockPreviewEnabled('?tab=map&mock=1')).toBe(true);
    expect(isMockPreviewEnabled('?tab=map')).toBe(false);
    expect(isMockPreviewEnabled('')).toBe(false);
  });
});
