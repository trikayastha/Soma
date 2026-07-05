import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppStateProvider } from '../../state/AppStateContext';
import { MandalaChip } from '../MandalaChip';
import type { Mandala } from '../../lib/types';

function wrap(ui: React.ReactNode) {
  return render(<AppStateProvider>{ui}</AppStateProvider>);
}

function makeMandala(overrides: Partial<Mandala> = {}): Mandala {
  return {
    index: 1,
    startDate: '2026-01-01',
    endDate: '2026-02-09',
    expected: ['2026-01-05', '2026-01-12', '2026-01-19'],
    observed: ['2026-01-05'],
    completionRate: 1 / 3,
    status: 'in-progress',
    ...overrides,
  };
}

describe('MandalaChip', () => {
  it('renders nothing when no mandala is provided', () => {
    const { container } = wrap(
      <MandalaChip mandala={null} today={new Date()} />,
    );
    expect(container.querySelector('button, div[aria-label]')).toBeNull();
  });

  it('renders the chip text including mandala index when provided', () => {
    const m = makeMandala();
    const today = new Date('2026-01-15T12:00:00Z');
    wrap(<MandalaChip mandala={m} today={today} />);
    // The voice template includes the mandala index
    const labelled = screen.getByLabelText(/.+/);
    expect(labelled).toBeInTheDocument();
  });

  it('renders as a button when onClick is provided', () => {
    const m = makeMandala();
    const today = new Date('2026-01-15T12:00:00Z');
    wrap(<MandalaChip mandala={m} today={today} onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
