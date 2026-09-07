import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LandingHeader from './LandingHeader';

describe('LandingHeader', () => {
  it('keeps the wordmark left-aligned so nav chrome cannot overlap it', () => {
    const { container } = render(<LandingHeader onNavigate={vi.fn()} variant="monument" />);
    const home = screen.getByRole('button', { name: 'ROBOAGENT home' });
    expect(home.className).toMatch(/shrink/);
    expect(home.className).not.toMatch(/absolute/);
    expect(home.className).not.toMatch(/left-1\/2/);
    expect(container.querySelector('[class*="left-1/2"]')).toBeNull();
  });

  it('hides the header wordmark when the landing hero already is the mark', () => {
    render(<LandingHeader onNavigate={vi.fn()} variant="cinematic" showBrand={false} />);
    expect(screen.queryByRole('button', { name: 'ROBOAGENT home' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });
});
