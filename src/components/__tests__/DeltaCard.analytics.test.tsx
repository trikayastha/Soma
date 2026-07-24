import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { DeltaCard } from '../DeltaCard';
import type { PersonalDelta } from '../../lib/types';

const track = vi.fn();
vi.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

// Five deltas so the "Show all" expander renders (initialLimit is 4).
function fiveDeltas(): PersonalDelta[] {
  const contexts: PersonalDelta['context'][] = [
    'shukla-ekadashi',
    'krishna-ekadashi',
    'purnima',
    'amavasya',
    'pradosh',
  ];
  return contexts.map((context, i) => ({
    key: `focus.${context}`,
    metric: 'focus',
    context,
    delta: 0.5 + i * 0.1,
    n: 5,
    se: 0.2,
    phraseKey: `focus.${context}`,
  }));
}

describe('DeltaCard analytics (N7 content_expanded: delta_detail)', () => {
  beforeEach(() => track.mockReset());

  it('fires content_expanded when Show all is opened', async () => {
    const user = userEvent.setup();
    render(
      <AppStateProvider>
        <DeltaCard deltas={fiveDeltas()} />
      </AppStateProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Show all/i }));
    expect(track).toHaveBeenCalledWith('content_expanded', {
      section: 'delta_detail',
    });
  });

  it('does not fire again when collapsing back to Show less', async () => {
    const user = userEvent.setup();
    render(
      <AppStateProvider>
        <DeltaCard deltas={fiveDeltas()} />
      </AppStateProvider>,
    );
    const btn = screen.getByRole('button', { name: /Show all/i });
    await user.click(btn); // expand
    await user.click(screen.getByRole('button', { name: /Show less/i })); // collapse
    expect(track).toHaveBeenCalledTimes(1);
  });
});
