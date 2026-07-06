import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { AppStateProvider } from '../../state/AppStateContext';
import { TithiSheet } from '../TithiSheet';

// ReceiptChip (rendered for citations) reads the app state for voice prefs.
function renderSheet(ui: ReactElement) {
  return render(<AppStateProvider>{ui}</AppStateProvider>);
}

describe('TithiSheet', () => {
  it('renders nothing when closed', () => {
    renderSheet(<TithiSheet index={11} open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the Sanskrit name, gloss, and tradition metadata for Ekadashi', () => {
    renderSheet(<TithiSheet index={11} open onClose={() => {}} />);
    expect(
      screen.getByRole('dialog', { name: /Ekadashi/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/“the eleventh”/)).toBeInTheDocument();
    expect(screen.getByText(/Vishnu/)).toBeInTheDocument();
    expect(screen.getByText(/A tithi is one step/i)).toBeInTheDocument();
  });

  it('closes via the close button and Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSheet(<TithiSheet index={30} open onClose={onClose} />);
    expect(
      screen.getByRole('heading', { name: /Amavasya/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Close/i }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
