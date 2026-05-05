import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../../state/AppStateContext';
import { useVoice } from '../useVoice';

function Probe() {
  const { voice, t, tFormat } = useVoice();
  return (
    <>
      <div data-testid="voice">{voice}</div>
      <div data-testid="cta">{t('fast.start.cta')}</div>
      <div data-testid="timer">{tFormat('fast.timer.label', { hours: 12 })}</div>
    </>
  );
}

function VoiceSwitcher({ to }: { to: 'coach' | 'scientific' | 'traditional' }) {
  const { setPreferences } = useAppState();
  return (
    <button onClick={() => setPreferences({ voice: to })} data-testid={`switch-${to}`}>
      switch
    </button>
  );
}

describe('useVoice()', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to coach voice and resolves keys', () => {
    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>,
    );
    expect(screen.getByTestId('voice').textContent).toBe('coach');
    expect(screen.getByTestId('cta').textContent).toBe('Begin fast');
    expect(screen.getByTestId('timer').textContent).toBe('Fasting · 12h');
  });

  it('re-renders consumers within one tick when voice changes', async () => {
    render(
      <AppStateProvider>
        <Probe />
        <VoiceSwitcher to="traditional" />
      </AppStateProvider>,
    );
    expect(screen.getByTestId('cta').textContent).toBe('Begin fast');

    await act(async () => {
      screen.getByTestId('switch-traditional').click();
    });

    expect(screen.getByTestId('voice').textContent).toBe('traditional');
    expect(screen.getByTestId('cta').textContent).toBe('Begin vrat');
    expect(screen.getByTestId('timer').textContent).toBe('Upavasa · 12 ghanta');
  });
});
