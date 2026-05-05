import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider, useAppState } from '../../../state/AppStateContext';
import { IntentRouter } from '../IntentRouter';

function PrefsProbe() {
  const { state } = useAppState();
  const p = state.preferences;
  return (
    <div data-testid="prefs">{`${p.intent ?? 'null'}|${p.theme}|${p.voice}`}</div>
  );
}

function Harness({ onSelected = vi.fn() }: { onSelected?: () => void }) {
  return (
    <AppStateProvider>
      <IntentRouter onSelected={onSelected} />
      <PrefsProbe />
    </AppStateProvider>
  );
}

describe('IntentRouter', () => {
  beforeEach(() => localStorage.clear());

  it('renders 4 cards as a radiogroup', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
  });

  it('persists optimize → performance + scientific', async () => {
    const onSelected = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelected={onSelected} />);
    await user.click(screen.getByRole('radio', { name: /Optimize my body/i }));
    expect(screen.getByTestId('prefs').textContent).toBe(
      'optimize|performance|scientific',
    );
    expect(onSelected).toHaveBeenCalledOnce();
  });

  it('persists tradition → devotional + traditional', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: /Follow tradition/i }));
    expect(screen.getByTestId('prefs').textContent).toBe(
      'tradition|devotional|traditional',
    );
  });

  it('persists tired → minimal + coach', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: /Tired of fasting apps/i }));
    expect(screen.getByTestId('prefs').textContent).toBe(
      'tired|minimal|coach',
    );
  });

  it('persists curious → performance + coach', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: /Curious about the moon/i }));
    expect(screen.getByTestId('prefs').textContent).toBe(
      'curious|performance|coach',
    );
  });

  it('supports keyboard navigation and Enter activation', async () => {
    const onSelected = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelected={onSelected} />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByTestId('prefs').textContent).toBe(
      'tradition|devotional|traditional',
    );
    expect(onSelected).toHaveBeenCalledOnce();
  });
});
