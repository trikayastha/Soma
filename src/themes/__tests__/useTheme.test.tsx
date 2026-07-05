import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../../state/AppStateContext';
import { useTheme } from '../useTheme';
import type { Theme } from '../../lib/types';

function ThemeMount() {
  useTheme();
  return null;
}

function ThemeSwitcher({ to }: { to: Theme }) {
  const { setPreferences } = useAppState();
  return (
    <button data-testid={`switch-${to}`} onClick={() => setPreferences({ theme: to })}>
      switch
    </button>
  );
}

describe('useTheme()', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('mounts the default theme on <html>', () => {
    render(
      <AppStateProvider>
        <ThemeMount />
      </AppStateProvider>,
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      'performance',
    );
  });

  it('updates <html data-theme> when preference changes', async () => {
    render(
      <AppStateProvider>
        <ThemeMount />
        <ThemeSwitcher to="devotional" />
        <ThemeSwitcher to="minimal" />
      </AppStateProvider>,
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      'performance',
    );

    await act(async () => {
      (document.querySelector('[data-testid="switch-devotional"]') as HTMLButtonElement).click();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('devotional');

    await act(async () => {
      (document.querySelector('[data-testid="switch-minimal"]') as HTMLButtonElement).click();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('minimal');
  });
});
