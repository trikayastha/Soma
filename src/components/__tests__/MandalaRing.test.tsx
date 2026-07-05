import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MandalaRing } from '../MandalaRing';
import type { Mandala } from '../../lib/types';

function makeMandala(overrides: Partial<Mandala> = {}): Mandala {
  return {
    index: 1,
    startDate: '2026-01-01',
    endDate: '2026-02-09',
    expected: ['2026-01-05', '2026-01-12', '2026-01-19'],
    observed: ['2026-01-05', '2026-01-12'],
    completionRate: 2 / 3,
    status: 'in-progress',
    ...overrides,
  };
}

describe('MandalaRing', () => {
  it('renders accessible label with mandala index, day count, and observed/expected fasts', () => {
    const m = makeMandala();
    const today = new Date('2026-01-15T12:00:00Z');
    render(<MandalaRing mandala={m} today={today} />);
    const ring = screen.getByRole('img');
    expect(ring.getAttribute('aria-label')).toMatch(/Mandala 1/);
    expect(ring.getAttribute('aria-label')).toMatch(/2 of 3/);
  });

  it('renders the mandala index in the center', () => {
    const m = makeMandala({ index: 7 });
    const today = new Date('2026-01-15T12:00:00Z');
    render(<MandalaRing mandala={m} today={today} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders the observed/expected count', () => {
    const m = makeMandala({
      observed: ['a', 'b', 'c'],
      expected: ['a', 'b', 'c', 'd'],
    });
    const today = new Date('2026-01-15T12:00:00Z');
    render(<MandalaRing mandala={m} today={today} />);
    expect(screen.getByText(/3 \/ 4 fasts/)).toBeInTheDocument();
  });
});
