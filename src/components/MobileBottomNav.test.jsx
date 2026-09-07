import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MobileBottomNav from './MobileBottomNav';

describe('MobileBottomNav', () => {
  it('keeps existing mobile destinations, badge, and route handlers in the pill', () => {
    const onNavigate = vi.fn();
    render(
      <MobileBottomNav route="dispatch" onNavigate={onNavigate} pendingCount={4} />,
    );

    expect(screen.getByTestId('mobile-pill-dock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Operations' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Command' }));
    expect(onNavigate).toHaveBeenCalledWith('overview');
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(onNavigate).toHaveBeenCalledWith('map');
  });
});
