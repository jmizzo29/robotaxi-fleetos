import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MonumentBottomChrome from './MonumentBottomChrome';

describe('MonumentBottomChrome', () => {
  it('renders the live destinations in a floating pill and keeps existing handlers', () => {
    const onNavigate = vi.fn();
    const onCommandSelect = vi.fn();

    render(
      <MonumentBottomChrome
        commandActive="today"
        utilityActive={null}
        onNavigate={onNavigate}
        onCommandSelect={onCommandSelect}
        swipeHint="Fleet"
      />,
    );

    expect(screen.getByTestId('mobile-pill-dock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();

    for (const label of ['Today', 'Fleet', 'Grow', 'Map', 'Network', 'Integrations', 'Settings']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Swipe for Fleet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Network' }));
    expect(onNavigate).toHaveBeenCalledWith('network');

    fireEvent.click(screen.getByRole('button', { name: 'Fleet' }));
    expect(onCommandSelect).toHaveBeenCalledWith('fleet');
  });

  it('keeps operations section handlers and the next-page swipe hint', () => {
    const onCommandSelect = vi.fn();
    render(
      <MonumentBottomChrome
        commandActive="plan"
        commandPages={[
          { id: 'plan', label: 'Plan' },
          { id: 'charge', label: 'Charge' },
          { id: 'alerts', label: 'Alerts' },
        ]}
        commandAriaLabel="Operations sections"
        onCommandSelect={onCommandSelect}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Charge' }));
    expect(onCommandSelect).toHaveBeenCalledWith('charge');
    expect(screen.getByText('Swipe for Charge')).toBeInTheDocument();
  });
});
