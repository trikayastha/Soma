import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { ReceiptChip } from '../ReceiptChip';

function renderChip(id: string) {
  return render(
    <AppStateProvider>
      <ReceiptChip citationId={id} />
    </AppStateProvider>,
  );
}

describe('ReceiptChip', () => {
  beforeEach(() => localStorage.clear());

  it('renders nothing for an unknown citation id', () => {
    const { container } = renderChip('does-not-exist');
    expect(container.querySelector('button')).toBeNull();
  });

  it('opens the overlay on click and closes on Escape', async () => {
    const user = userEvent.setup();
    renderChip('autophagy-mizushima-2008');
    const trigger = screen.getByRole('button');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Autophagy fights disease/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exposes a Read source link to the citation url', async () => {
    const user = userEvent.setup();
    renderChip('autophagy-mizushima-2008');
    await user.click(screen.getByRole('button'));
    const link = screen.getByText(/Read source/);
    expect(link).toHaveAttribute('href', expect.stringMatching(/^https?:\/\//));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('uses the coach voice header by default', async () => {
    const user = userEvent.setup();
    renderChip('autophagy-mizushima-2008');
    await user.click(screen.getByRole('button'));
    expect(screen.getByText(/Why we're saying this/i)).toBeInTheDocument();
  });
});
