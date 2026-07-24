import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { ReceiptChip } from '../ReceiptChip';

const track = vi.fn();
vi.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

const CITATION = 'autophagy-mizushima-2008';

function renderChip(location?: 'why_this_day' | 'tithi_sheet') {
  return render(
    <AppStateProvider>
      <ReceiptChip citationId={CITATION} location={location} />
    </AppStateProvider>,
  );
}

describe('ReceiptChip analytics (N8 citation_opened)', () => {
  beforeEach(() => {
    localStorage.clear();
    track.mockReset();
  });

  it('fires citation_opened with the surface location and followed_link:false on open', async () => {
    const user = userEvent.setup();
    renderChip('tithi_sheet');
    await user.click(screen.getByRole('button'));
    expect(track).toHaveBeenCalledWith('citation_opened', {
      location: 'tithi_sheet',
      followed_link: false,
    });
  });

  it('fires the open event once and not again on Escape-to-close', async () => {
    const user = userEvent.setup();
    renderChip('why_this_day');
    await user.click(screen.getByRole('button')); // open
    await user.keyboard('{Escape}'); // close (supported dismissal)
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('citation_opened', {
      location: 'why_this_day',
      followed_link: false,
    });
  });

  it('fires followed_link:true when the Read source link is clicked', async () => {
    const user = userEvent.setup();
    renderChip('why_this_day');
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('link', { name: /Read source/i }));
    expect(track).toHaveBeenCalledWith('citation_opened', {
      location: 'why_this_day',
      followed_link: true,
    });
  });

  it('defaults location to why_this_day when unspecified', async () => {
    const user = userEvent.setup();
    renderChip();
    await user.click(screen.getByRole('button'));
    expect(track).toHaveBeenCalledWith('citation_opened', {
      location: 'why_this_day',
      followed_link: false,
    });
  });
});
