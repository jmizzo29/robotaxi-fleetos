import { describe, expect, it } from 'vitest';
import { legalCopy, legalNavLinks } from './legalCopy';

describe('legalCopy', () => {
  it('includes privacy and terms sections', () => {
    expect(legalCopy.privacy.sections.length).toBeGreaterThan(0);
    expect(legalCopy.terms.sections.length).toBeGreaterThan(0);
  });

  it('exposes legal nav links for About and menu', () => {
    expect(legalNavLinks.map((link) => link.route)).toEqual(['privacy', 'terms']);
  });
});
