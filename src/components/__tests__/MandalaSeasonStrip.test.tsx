import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MandalaSeasonStrip } from '../MandalaSeasonStrip';
import type { Mandala } from '../../lib/types';

function makeMandala(i: number, overrides: Partial<Mandala> = {}): Mandala {
  return {
    index: i,
    startDate: `2026-01-${String(i).padStart(2, '0')}`,
    endDate: '2026-02-09',
    expected: ['a', 'b', 'c'],
    observed: ['a', 'b'],
    completionRate: 0.66,
    status: 'completed',
    ...overrides,
  };
}

describe('MandalaSeasonStrip', () => {
  it('renders nothing when there are no mandalas', () => {
    const { container } = render(<MandalaSeasonStrip mandalas={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the count and the bars with role="img"', () => {
    const mandalas = Array.from({ length: 5 }, (_, i) => makeMandala(i + 1));
    render(<MandalaSeasonStrip mandalas={mandalas} />);
    expect(screen.getByText(/Last 5 mandalas/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('limits to the trailing N when given more than count', () => {
    const mandalas = Array.from({ length: 20 }, (_, i) => makeMandala(i + 1));
    render(<MandalaSeasonStrip mandalas={mandalas} count={6} />);
    expect(screen.getByText(/Last 6 mandalas/)).toBeInTheDocument();
  });
});
