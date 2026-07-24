import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { WhyThisDay } from '../WhyThisDay';

const track = vi.fn();
vi.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

function renderWhy() {
  return render(
    <AppStateProvider>
      <WhyThisDay kind="ekadashi" archetype={null} />
    </AppStateProvider>,
  );
}

describe('WhyThisDay analytics (N7 content_expanded: why_this_day)', () => {
  beforeEach(() => {
    localStorage.clear();
    track.mockReset();
  });

  it('fires content_expanded once when the panel is opened', async () => {
    const user = userEvent.setup();
    renderWhy();
    await user.click(screen.getByRole('button', { name: /Why this day\?/i }));
    expect(track).toHaveBeenCalledWith('content_expanded', {
      section: 'why_this_day',
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('does not fire again when the panel is collapsed', async () => {
    const user = userEvent.setup();
    renderWhy();
    const btn = screen.getByRole('button', { name: /Why this day\?/i });
    await user.click(btn); // open
    await user.click(btn); // close
    expect(track).toHaveBeenCalledTimes(1);
  });
});
