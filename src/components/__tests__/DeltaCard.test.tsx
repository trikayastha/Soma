import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { DeltaCard } from '../DeltaCard';
import type { PersonalDelta } from '../../lib/types';

function wrap(ui: React.ReactNode) {
  return render(<AppStateProvider>{ui}</AppStateProvider>);
}

function delta(overrides: Partial<PersonalDelta> = {}): PersonalDelta {
  return {
    key: 'focus.shukla-ekadashi',
    metric: 'focus',
    context: 'shukla-ekadashi',
    delta: 0.7,
    n: 5,
    se: 0.2,
    phraseKey: 'focus.shukla-ekadashi',
    ...overrides,
  };
}

describe('DeltaCard', () => {
  it('renders the empty-state copy when no deltas pass the gate', () => {
    wrap(<DeltaCard deltas={[]} />);
    expect(screen.getByText(/Personal patterns/i)).toBeInTheDocument();
    // Empty state copy is voice-driven; the section still renders.
    expect(screen.queryByText(/n =/)).toBeNull();
  });

  it('renders a positive focus delta with sign-aware phrasing', () => {
    wrap(<DeltaCard deltas={[delta({ delta: 0.7 })]} />);
    expect(screen.getByText(/Your focus rises \+0\.7 on Shukla Ekadashi/)).toBeInTheDocument();
    expect(screen.getByText(/n = 5 sessions · SE = 0\.20/)).toBeInTheDocument();
  });

  it('renders a negative delta with the unicode minus sign', () => {
    wrap(<DeltaCard deltas={[delta({ delta: -0.5, metric: 'energy' })]} />);
    expect(screen.getByText(/Your energy shifts −0\.5 on Shukla Ekadashi/)).toBeInTheDocument();
  });

  it('caps visible deltas to initialLimit and offers Show all', async () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      delta({ key: `focus.k${i}`, delta: 0.5 + i * 0.1 }),
    );
    const user = userEvent.setup();
    wrap(<DeltaCard deltas={many} initialLimit={3} />);
    expect(screen.getAllByText(/Your focus rises/i)).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: /Show all \(6\)/ }));
    expect(screen.getAllByText(/Your focus rises/i)).toHaveLength(6);
  });
});
